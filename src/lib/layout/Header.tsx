/* eslint-disable react/no-unused-prop-types */
import {
  Box,
  Flex,
  Text,
  IconButton,
  Stack,
  Collapsible,
  Icon,
  Link,
  useDisclosure,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import {
  LuGithub,
  LuMenu,
  LuX,
  LuChevronDown,
  LuChevronRight,
} from 'react-icons/lu';

import { ColorModeButton } from '@/components/ui/color-mode';
import {
  HoverCardArrow,
  HoverCardContent,
  HoverCardRoot,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import type { NavItem } from '@/site.config';
import { siteConfig } from '@/site.config';

import SearchModal from './SearchModal';

const LogoIcon = ({ size = 40 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="25.536"
      y="13.4861"
      width="1.71467"
      height="16.7338"
      transform="rotate(45.9772 25.536 13.4861)"
      fill="white"
    />
    <path
      d="M26 14H36.8C37.4628 14 38 14.5373 38 15.2V36.8C38 37.4628 37.4628 38 36.8 38H15.2C14.5373 38 14 37.4628 14 36.8V26"
      fill="white"
    />
    <path
      d="M26 14H36.8C37.4628 14 38 14.5373 38 15.2V36.8C38 37.4628 37.4628 38 36.8 38H15.2C14.5373 38 14 37.4628 14 36.8V26"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M26 14V3.2C26 2.53726 25.4628 2 24.8 2H3.2C2.53726 2 2 2.53726 2 3.2V24.8C2 25.4628 2.53726 26 3.2 26H14"
      fill="white"
    />
    <path
      d="M26 14V3.2C26 2.53726 25.4628 2 24.8 2H3.2C2.53726 2 2 2.53726 2 3.2V24.8C2 25.4628 2.53726 26 3.2 26H14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* P letter in top-right box */}
    <path
      d="M0 45.26L0 9.47L13.50 9.47Q17.07 9.47 18.95 9.81Q21.58 10.25 23.36 11.49Q25.15 12.72 26.23 14.94Q27.32 17.16 27.32 19.82Q27.32 24.39 24.41 27.55Q21.51 30.71 13.92 30.71L4.74 30.71L4.74 45.26L0 45.26M4.74 26.49L13.99 26.49Q18.58 26.49 20.51 24.78Q22.44 23.07 22.44 19.97Q22.44 17.72 21.30 16.13Q20.17 14.53 18.31 14.01Q17.11 13.70 13.89 13.70L4.74 13.70L4.74 26.49Z"
      fill="black"
      stroke="black"
      strokeWidth="3"
      transform="scale(0.34) translate(25, 13)"
    />
    {/* A letter in top-right box */}
    <path
      d="M0 45.26L13.75 9.47L18.85 9.47L33.50 45.26L28.10 45.26L23.93 34.42L8.96 34.42L5.03 45.26L0 45.26M10.33 30.57L22.46 30.57L18.73 20.65Q17.02 16.14 16.19 13.23Q15.50 16.67 14.26 20.07L10.33 30.57Z"
      fill="black"
      stroke="black"
      strokeWidth="3"
      transform="scale(0.34) translate(63, 50)"
    />
  </svg>
);

const DesktopSubNav = ({ title, url }: NavItem) => {
  return (
    <Link
      as={NextLink}
      href={url}
      role="group"
      display="block"
      p={2}
      rounded="md"
      _hover={{ bg: { base: 'pink.50', _dark: 'gray.900' } }}
    >
      <Stack direction="row" align="center">
        <Box>
          <Text
            transition="all .3s ease"
            _groupHover={{ color: 'pink.400' }}
            fontWeight={500}
          >
            {title}
          </Text>
        </Box>
        <Flex
          transition="all .3s ease"
          transform="translateX(-10px)"
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify="flex-end"
          align="center"
          flex={1}
        >
          <Icon color="pink.400" w={5} h={5}>
            <LuChevronRight />
          </Icon>
        </Flex>
      </Stack>
    </Link>
  );
};

const DesktopNav = () => {
  return (
    <Stack direction="row" gap={4}>
      {siteConfig.navigation.map((navItem) => (
        <Box key={navItem.title}>
          <HoverCardRoot>
            <HoverCardTrigger asChild>
              <Link
                as={NextLink}
                p={2}
                href={navItem.url ?? '#'}
                fontSize="sm"
                fontWeight={500}
                color="gray.600"
                _dark={{ color: 'gray.200' }}
                _hover={{
                  textDecoration: 'none',
                  color: { base: 'gray.800', _dark: 'white' },
                }}
              >
                {navItem.title}
              </Link>
            </HoverCardTrigger>

            {navItem.children && (
              <HoverCardContent>
                <HoverCardArrow />
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.title} {...child} />
                  ))}
                </Stack>
              </HoverCardContent>
            )}
          </HoverCardRoot>
        </Box>
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ title, url, children }: NavItem) => {
  const { open, onToggle } = useDisclosure();

  return (
    <Stack gap={4} onClick={children && onToggle}>
      <Link href={url ?? '#'}>
        <Flex
          py={2}
          as={Link}
          // href={href ?? '#'}
          justify="space-between"
          align="center"
          _hover={{
            textDecoration: 'none',
          }}
        >
          <Text fontWeight={600} color="gray.600" _dark={{ color: 'gray.200' }}>
            {title}
          </Text>
          {children && (
            <Icon
              transition="all .25s ease-in-out"
              transform={open ? 'rotate(180deg)' : ''}
              w={6}
              h={6}
            >
              <LuChevronDown />
            </Icon>
          )}
        </Flex>
      </Link>

      <Collapsible.Root open={open} style={{ marginTop: '0!important' }}>
        <Collapsible.Content>
          <Stack
            mt={2}
            pl={4}
            borderLeft={1}
            borderStyle="solid"
            borderColor="gray.200"
            _dark={{ borderColor: 'gray.700' }}
            align="start"
          >
            {children &&
              children.map((child) => (
                <Link as={NextLink} key={child.title} py={2} href={child.url}>
                  {child.title}
                </Link>
              ))}
          </Stack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Stack>
  );
};

const MobileNav = () => {
  return (
    <Stack bg="white" _dark={{ bg: 'gray.800' }} p={4} display={{ md: 'none' }}>
      {siteConfig.navigation.map((navItem) => (
        <MobileNavItem key={navItem.title} {...navItem} />
      ))}
    </Stack>
  );
};

const Header = () => {
  const { open, onToggle } = useDisclosure();
  return (
    <Box>
      <Flex
        minH="60px"
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderStyle="solid"
        align="center"
      >
        <Flex
          flex={{ base: 1 }}
          justify={{ base: 'left', md: 'start' }}
          align="center"
        >
          <Link as={NextLink} href="/" _hover={{ textDecoration: 'none' }}>
            <Flex align="center" gap={2}>
              <Box color="teal.600" _dark={{ color: 'teal.300' }}>
                <LogoIcon size={40} />
              </Box>
              <Box display={{ base: 'none', md: 'block' }}>
                <Text
                  fontSize="lg"
                  fontWeight="semibold"
                  color="gray.800"
                  _dark={{ color: 'white' }}
                >
                  {siteConfig.title
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                    .replace(/^./, (match) => match.toUpperCase())}
                </Text>
              </Box>
            </Flex>
          </Link>
        </Flex>

        <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
          <DesktopNav />
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify="flex-end"
          direction="row"
          gap={3}
          align="center"
        >
          <SearchModal />
          <ColorModeButton />
          <Link
            href={siteConfig.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
          >
            <IconButton
              aria-label="GitHub Repository"
              bg="transparent"
              color="gray.600"
              _dark={{ color: 'gray.400' }}
              _hover={{
                color: 'gray.800',
                _dark: { color: 'white' },
              }}
              size="sm"
            >
              <LuGithub />
            </IconButton>
          </Link>
          <Flex
            flex={{ base: 1, md: 'auto' }}
            ml={{ base: -2 }}
            display={{ base: 'flex', md: 'none' }}
          >
            <IconButton
              aria-label="Toggle Navigation"
              onClick={onToggle}
              bg="transparent"
              color="gray.600"
              _dark={{ color: 'gray.400' }}
              _hover={{
                color: 'gray.800',
                _dark: { color: 'white' },
              }}
              size="sm"
            >
              {open ? <LuX /> : <LuMenu />}
            </IconButton>
          </Flex>
        </Stack>
      </Flex>

      <Collapsible.Root open={open}>
        <Collapsible.Content>
          <MobileNav />
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

export default Header;
