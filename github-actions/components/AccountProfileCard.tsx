import { HStack, VStack, Image, type VirtualNode } from 'scripting'
import { GitHubAPI, type AccountProfile } from '../services/AppModel'
import { useAccountProfile, type AccountProfileState } from '../hooks/useAccountProfile'
import { MotionRow, MotionText as Text, motion, motionTransition } from './Motion'
import { visual } from '../visual.config'

export type { AccountProfile } from '../services/AppModel'

export type AccountProfileContentProps = {
  profile: AccountProfile
  loading?: boolean
  error?: string
  loadAvatar?: boolean
}

export function AccountProfileContent({ profile, loading = false, error = '', loadAvatar = false }: AccountProfileContentProps) {
  const login: string = profile.login.trim()
  const name: string = profile.name?.trim() || login || 'GitHub 账户'
  const details: string = [profile.company?.trim(), profile.location?.trim()].filter(Boolean).join(' · ')
  const stats: string = [
    typeof profile.public_repos === 'number' ? `公开仓库 ${profile.public_repos}` : '',
    typeof profile.followers === 'number' ? `关注者 ${profile.followers}` : '',
    typeof profile.following === 'number' ? `正在关注 ${profile.following}` : '',
  ].filter(Boolean).join(' · ')
  const avatarURL: string = /^https:\/\/avatars\.githubusercontent\.com\//i.test(profile.avatar_url ?? '') ? profile.avatar_url! : ''
  const placeholder: VirtualNode = <Image systemName="person.crop.circle.fill" font={visual.account.avatarSize} foregroundStyle={visual.colors.secondaryLabel} frame={{ width: visual.account.avatarSize, height: visual.account.avatarSize }} />

  return (
    <VStack alignment="leading" spacing={visual.account.spacing} frame={{ maxWidth: 'infinity', alignment: 'leading' }} animation={{ animation: motion, value: `${name}|${loading}|${error}|${stats}` }}>
      <HStack alignment="center" spacing={visual.account.spacing}>
        {loadAvatar && avatarURL ? (
          <Image imageUrl={avatarURL} resizable placeholder={placeholder} frame={{ width: visual.account.avatarSize, height: visual.account.avatarSize }} clipShape="circle" transition={motionTransition} />
        ) : placeholder}
        <VStack alignment="leading" spacing={visual.spacing[4]} frame={{ maxWidth: 'infinity', alignment: 'leading' }}>
          <Text style={{ fontSize: visual.account.nameFont, fontWeight: '600' }} numberOfLines={1}>{name}</Text>
          {login ? <Text style={{ fontSize: visual.account.detailFont, color: visual.colors.secondaryLabel }} numberOfLines={1}>{`@${login}`}</Text> : null}
          {details ? <Text style={{ fontSize: visual.account.detailFont, color: visual.colors.secondaryLabel }} numberOfLines={2}>{details}</Text> : null}
        </VStack>
      </HStack>
      {visual.account.showBio && profile.bio?.trim() ? <Text style={{ fontSize: visual.account.detailFont }} numberOfLines={3}>{profile.bio.trim()}</Text> : null}
      {visual.account.showStats && stats ? <Text style={{ fontSize: visual.account.detailFont, color: visual.colors.secondaryLabel }} numberOfLines={2}>{stats}</Text> : null}
      {loading || error ? <Text style={{ fontSize: visual.account.detailFont, color: visual.colors.secondaryLabel }} numberOfLines={3}>{error || '正在加载账户资料…'}</Text> : null}
    </VStack>
  )
}

export function AccountProfileCard({ api }: { api: GitHubAPI }) {
  const state: AccountProfileState = useAccountProfile(api)
  return (
    <MotionRow alignment="top" spacing={visual.account.spacing}>
      <AccountProfileContent {...state} loadAvatar />
    </MotionRow>
  )
}
