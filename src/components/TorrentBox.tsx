import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  LightMode,
  Progress,
  Skeleton,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { TorrCategory, TorrTorrentInfo } from "../types";
import stateDictionary from "../utils/StateDictionary";
import filesize from "filesize";
import {
  IoCalendar,
  IoCloudUpload,
  IoDownload,
  IoOptions,
  IoPause,
  IoPlay,
  IoPricetags,
  IoServer,
  IoSpeedometer,
} from "react-icons/io5";
import { StatWithIcon } from "./StatWithIcon";
import { useMutation } from "react-query";
import { TorrClient } from "../utils/TorrClient";
import IosActionSheet from "./ios/IosActionSheet";

export interface TorrentBoxProps {
  torrentData: Omit<TorrTorrentInfo, "hash">;
  hash: string;
  categories: TorrCategory[];
  loading?: boolean;
}

const TorrentBox = ({
  torrentData,
  hash,
  categories,
  loading,
}: TorrentBoxProps) => {
  const BoxShadow = useColorModeValue("lg", "dark-lg");
  const BoxBg = useColorModeValue("white", "gray.900");

  const isDone = (torrentData.progress || 0) >= 1;

  const isPaused = ["pausedDL", "pausedUP"].includes(torrentData.state);

  const isDownloading = [
    "downloading",
    "metaDL",
    "queuedDL",
    "stalledDL",
    "checkingDL",
    "forceDL",
    "checkingResumeData",
    "allocating",
  ].includes(torrentData.state);

  const date = new Date(0);
  date.setSeconds(torrentData.eta); // specify value for SECONDS here
  const timeString = torrentData.eta ? date.toISOString().substr(11, 8) : 0;

  const [waiting, setWaiting] = useState<"" | "mainBtn" | "category">();

  useEffect(() => {
    setWaiting("");
  }, [torrentData.state, torrentData.category]);

  const { mutate: pause } = useMutation(
    "pauseTorrent",
    () => TorrClient.pause(hash),
    {
      onMutate: () => setWaiting("mainBtn"),
      onError: () => setWaiting(""),
    }
  );

  const { mutate: resume } = useMutation(
    "resumeTorrent",
    () => TorrClient.resume(hash),
    {
      onMutate: () => setWaiting("mainBtn"),
      onError: () => setWaiting(""),
    }
  );

  const deleteConfirmationDisclosure = useDisclosure();
  const { mutate: remove } = useMutation(
    "deleteTorrent",
    (deleteFiles: boolean) => TorrClient.remove(hash, deleteFiles),
    {
      onMutate: () => setWaiting("mainBtn"),
      onError: () => setWaiting(""),
    }
  );

  const categoryChangeDisclosure = useDisclosure();
  const { mutate: changeCategory } = useMutation(
    "changeCategory",
    (category: string) => TorrClient.setTorrentCategory(hash, category),
    {
      onMutate: () => setWaiting("category"),
      onError: () => setWaiting(""),
    }
  );

  const actionSheetDisclosure = useDisclosure();

  const memoizedLoading = useMemo(
    () => (
      <Box
        shadow={BoxShadow}
        px={5}
        py={4}
        rounded={"xl"}
        bgColor={"grayAlpha.200"}
      >
        <Skeleton
          height={5}
          width={(Math.random() * (100 - 40) + 40).toString() + "%"}
        />
        <Flex mt={2} gap={2}>
          <Skeleton height={4} width={24} />
          <Skeleton height={4} width={16} />
          <Skeleton height={4} width={12} />
        </Flex>
        <Flex
          mt={4}
          gap={2}
          justifyContent={"space-between"}
          alignItems={"end"}
        >
          <Skeleton
            height={8}
            width={16}
            startColor={"blue.500"}
            endColor={"blue.700"}
          />
          <Skeleton height={5} width={20} />
        </Flex>
        <Skeleton
          mt={2}
          height={3}
          width={"100%"}
          startColor={"blue.500"}
          endColor={"blue.700"}
        />
        <Flex mt={4} justifyContent={"space-between"} alignItems={"center"}>
          <Flex gap={2}>
            <Skeleton height={4} width={16} />
            <Skeleton height={4} width={24} />
          </Flex>
          <Flex gap={2}>
            <Skeleton height={8} width={12} />
            <Skeleton
              height={8}
              width={12}
              startColor={"blue.500"}
              endColor={"blue.700"}
            />
          </Flex>
        </Flex>
      </Box>
    ),
    //eslint-disable-next-line
    []
  );

  if (loading) {
    return memoizedLoading;
  }

  return (
    <Box shadow={BoxShadow} px={5} py={4} rounded={"xl"} bgColor={BoxBg}>
      <Heading noOfLines={1} size={"lg"}>
        {torrentData.name}
      </Heading>
      <HStack color={"grayAlpha.800"} gap={2}>
        <StatWithIcon
          icon={<IoCalendar />}
          label={new Date(torrentData.added_on * 1000).toLocaleDateString()}
        />
        <StatWithIcon
          icon={<IoServer />}
          label={filesize(torrentData.total_size, { round: 1 })}
        />
        <StatWithIcon
          loading={waiting === "category"}
          icon={<IoPricetags />}
          label={torrentData.category || "–"}
        />
      </HStack>
      <Flex mt={5} mb={2} justifyContent={"space-between"} alignItems={"end"}>
        <HStack alignItems={"end"}>
          <Heading color={"blue.500"} size={"lg"}>
            {(100 * torrentData.progress).toFixed(0)}%
          </Heading>
          {!isDone && (
            <Text color={"grayAlpha.600"}>
              {filesize(torrentData.downloaded, { round: 1 })}
            </Text>
          )}
        </HStack>
        <Heading size={"md"} opacity={0.25}>
          {torrentData.eta !== 8640000 ? (
            <span>{timeString}</span>
          ) : (
            <span>{stateDictionary[torrentData.state].short}</span>
          )}
        </Heading>
      </Flex>
      <LightMode>
        <Progress
          rounded={100}
          size={"sm"}
          color={"blue.500"}
          value={100 * torrentData.progress}
        />
      </LightMode>
      <Flex justifyContent={"flex-end"} alignItems={"center"} mt={3}>
        {isPaused || (
          <Flex alignItems={"center"} gap={4} flexGrow={2}>
            <StatWithIcon
              lit={
                isDownloading
                  ? torrentData.num_seeds > 0
                  : isDone
                  ? torrentData.num_leechs > 0
                  : false
              }
              icon={
                isDownloading ? (
                  <IoDownload size={25} />
                ) : (
                  <IoCloudUpload size={20} />
                )
              }
              label={
                isDownloading
                  ? torrentData.num_seeds
                  : isDone
                  ? torrentData.num_leechs
                  : 0
              }
            />
            <StatWithIcon
              lit={isDone ? torrentData.upspeed > 0 : torrentData.dlspeed > 0}
              icon={<IoSpeedometer />}
              label={
                (isPaused
                  ? 0
                  : isDone
                  ? filesize(torrentData.upspeed, { round: 1 })
                  : filesize(torrentData.dlspeed, { round: 1 })) + "/s"
              }
            />
          </Flex>
        )}
        <ButtonGroup>
          <IosActionSheet
            trigger={
              <Button
                variant={"ghost"}
                size={"md"}
                onClick={actionSheetDisclosure.onOpen}
              >
                <IoOptions size={25} />
              </Button>
            }
            disclosure={actionSheetDisclosure}
            options={[
              {
                label: "Remove Torrent",
                onClick: () => deleteConfirmationDisclosure.onOpen(),
                danger: true,
              },
              {
                label: "Change Category",
                onClick: () => categoryChangeDisclosure.onOpen(),
              },
            ]}
          />
          <IosActionSheet
            disclosure={deleteConfirmationDisclosure}
            options={[
              {
                label: "Delete Files",
                onClick: () => remove(true),
                danger: true,
              },
              {
                label: "Remove Torrent Only",
                onClick: () => remove(false),
              },
            ]}
          />
          <IosActionSheet
            disclosure={categoryChangeDisclosure}
            options={categories.map((cat) => ({
              label: cat.name,
              onClick: () => changeCategory(cat.name),
            }))}
          />
          {isPaused ? (
            <LightMode>
              <Button
                size={"md"}
                colorScheme={"blue"}
                onClick={() => resume()}
                isLoading={waiting === "mainBtn"}
              >
                <IoPlay size={25} />
              </Button>
            </LightMode>
          ) : (
            <Button
              size={"md"}
              variant={"ghost"}
              color={"blue.500"}
              onClick={() => pause()}
              isLoading={waiting === "mainBtn"}
            >
              <IoPause size={25} />
            </Button>
          )}
        </ButtonGroup>
      </Flex>
    </Box>
  );
};

export default TorrentBox;