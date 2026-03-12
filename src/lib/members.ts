export const memberTags = [
  'Crypto',
  'PWN',
  'Reversing',
  'Web',
  'ML',
  'Hardware',
  'Misc',
  'Stego',
  'Forensic',
  'OSINT',
  'Blockchain',
  'Founder',
  'Infra',
] as const;

export type MemberTag = (typeof memberTags)[number];

export type MemberSocialType = 'github' | 'email' | 'website' | 'linkedin' | 'x';

export interface MemberSocial {
  type: MemberSocialType;
  url: string;
  label: string;
}

export interface TeamMember {
  slug: string;
  name: string;
  email?: string;
  avatarUrl: string;
  fallbackIcon: string;
  bio: string;
  specialties: MemberTag[];
  joinDate: string;
  joinDateLabel: string;
  socials?: MemberSocial[];
  status: 'active' | 'retired';
}

const currentMemberJoinDate = '2025-08-01';
const currentMemberJoinDateLabel = 'August 2025';

export const teamMembers: TeamMember[] = [
  {
    slug: 'rios',
    name: 'RIOS',
    email: 'rios@ch0wn3rs.ninja',
    avatarUrl: 'https://github.com/rios.png?size=240',
    fallbackIcon: 'ph-key',
    bio: 'Focused on solving cryptography challenges.',
    specialties: ['Crypto', 'Founder'],
    joinDate: currentMemberJoinDate,
    joinDateLabel: currentMemberJoinDateLabel,
    socials: [
      { type: 'github', url: 'https://github.com/rios', label: 'GitHub' },
      { type: 'email', url: 'mailto:rios@ch0wn3rs.ninja', label: 'Email' },
    ],
    status: 'active',
  },
  {
    slug: '02loveslollipop',
    name: '02loveslollipop',
    email: 'zerotwo@ch0wn3rs.ninja',
    avatarUrl: 'https://avatars.githubusercontent.com/u/88346508?v=4',
    fallbackIcon: 'ph-brain',
    bio: 'Just a ZeroTwo who loves lollipops and apparently CTF challenges.',
    specialties: ['ML', 'Crypto', 'Hardware', 'Infra', 'Founder'],
    joinDate: currentMemberJoinDate,
    joinDateLabel: currentMemberJoinDateLabel,
    socials: [
      { type: 'github', url: 'https://github.com/02loveslollipop', label: 'GitHub' },
      { type: 'email', url: 'mailto:zerotwo@ch0wn3rs.ninja', label: 'Email' },
      { type: 'x', url: 'https://x.com/02lovelollipop', label: 'X' },
      { type: 'linkedin', url: 'https://www.linkedin.com/in/mateo-monsalve-valencia-198395367/', label: 'LinkedIn' },
      { type: 'website', url: 'https://02labs.me', label: 'Website' },
    ],
    status: 'active',
  },
  {
    slug: 'hrcamilo',
    name: 'hrcamilo',
    email: 'hrcamilo@ch0wn3rs.ninja',
    avatarUrl: 'https://avatars.githubusercontent.com/u/58581298?v=4',
    fallbackIcon: 'ph-binoculars',
    bio: 'Focused on solving OSINT and stego challenges.',
    specialties: ['Stego', 'OSINT', 'Founder'],
    joinDate: currentMemberJoinDate,
    joinDateLabel: currentMemberJoinDateLabel,
    socials: [
      { type: 'github', url: 'https://github.com/hrcamilo11', label: 'GitHub' },
      { type: 'email', url: 'mailto:hrcamilo@ch0wn3rs.ninja', label: 'Email' },
    ],
    status: 'active',
  },
  {
    slug: 'infinitypaiin',
    name: 'InfinityPaiin',
    email: 'infinitypaiin@ch0wn3rs.ninja',
    avatarUrl: 'https://avatars.githubusercontent.com/u/29224671?v=4',
    fallbackIcon: 'ph-gear',
    bio: 'Focused on solving reversing challenges.',
    specialties: ['Reversing', 'Founder'],
    joinDate: currentMemberJoinDate,
    joinDateLabel: currentMemberJoinDateLabel,
    socials: [
      { type: 'github', url: 'https://github.com/SanTacrZ', label: 'GitHub' },
      { type: 'email', url: 'mailto:infinitypaiin@ch0wn3rs.ninja', label: 'Email' },
    ],
    status: 'active',
  },
  {
    slug: 'neyi21',
    name: 'Neyi21',
    email: 'neyi21@ch0wn3rs.ninja',
    avatarUrl: '/neyi21.jpeg',
    fallbackIcon: 'ph-detective',
    bio: 'Focused on solving forensics challenges.',
    specialties: ['Forensic', 'Founder'],
    joinDate: currentMemberJoinDate,
    joinDateLabel: currentMemberJoinDateLabel,
    socials: [
      { type: 'github', url: 'https://github.com/Joaquin9999', label: 'GitHub' },
      { type: 'email', url: 'mailto:neyi21@ch0wn3rs.ninja', label: 'Email' },
    ],
    status: 'active',
  },
  {
    slug: 'fu11shoot',
    name: 'Fu11shoot',
    email: 'fu11shoot@ch0wn3rs.ninja',
    avatarUrl: 'https://avatars.githubusercontent.com/u/97989125?v=4',
    fallbackIcon: 'ph-globe',
    bio: 'Focused on solving pwn and web challenges.',
    specialties: ['PWN', 'Web', 'Founder'],
    joinDate: currentMemberJoinDate,
    joinDateLabel: currentMemberJoinDateLabel,
    socials: [
      { type: 'github', url: 'https://github.com/TomasGutierrezOrozco', label: 'GitHub' },
      { type: 'email', url: 'mailto:fu11shoot@ch0wn3rs.ninja', label: 'Email' },
      { type: 'linkedin', url: 'https://www.linkedin.com/in/tom%C3%A1s-guti%C3%A9rrez-orozco-74ba09328/', label: 'LinkedIn' },
      { type: 'website', url: 'https://www.fu11shoot.com', label: 'Website' },
    ],
    status: 'active',
  },
];

export const activeMembers = teamMembers.filter((member) => member.status === 'active');
export const retiredMembers = teamMembers.filter((member) => member.status === 'retired');
