import { useEffect, useState } from 'scripting'
import { GitHubAPI, type AccountProfile } from '../services/AppModel'
import { animateChange } from '../components/Motion'

export type AccountProfileState = {
  profile: AccountProfile
  loading: boolean
  error: string
}

type LoadedAccount = AccountProfileState & { api: GitHubAPI }

export function useAccountProfile(api: GitHubAPI): AccountProfileState {
  const [state, setState] = useState<LoadedAccount | null>(null)

  useEffect(() => {
    let active: boolean = true
    void api.getCurrentUser().then((profile: AccountProfile): void => {
      if (!active) return
      animateChange(() => {
        if (active) setState({ api, profile, loading: false, error: '' })
      })
    }).catch((): void => {
      if (!active) return
      animateChange(() => {
        if (active) setState({
          api,
          profile: { login: api.getUsername() },
          loading: false,
          error: '账户资料加载失败，请检查网络与登录授权，稍后重新进入设置重试',
        })
      })
    })
    return () => { active = false }
  }, [api])

  return state?.api === api ? state : {
    profile: { login: api.getUsername() },
    loading: true,
    error: '',
  }
}
