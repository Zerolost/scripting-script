import { useCallback, useEffect, useRef, useState } from 'scripting'
import { animateChange } from '../components/Motion'
import { useLoadList, type GitHubAPI, type Repo } from '../services/AppModel'
import { getActionRepositories, getActionRepositoryNotice } from '../services/ActionRepositories'

export function useActionRepositories(api: GitHubAPI): ReturnType<typeof useLoadList<Repo>> & { noticeMsg: string } {
  const [noticeMsg, setNoticeMsg] = useState<string>('')
  const active = useRef<boolean>(false)
  const generation = useRef<number>(0)

  useEffect(() => {
    active.current = true
    setNoticeMsg('')
    return () => {
      active.current = false
      generation.current += 1
    }
  }, [api])

  const fetcher: (force?: boolean) => Promise<Repo[]> = useCallback(async (force: boolean = false): Promise<Repo[]> => {
    const requestGeneration: number = generation.current
    const updateNotice = (message: string): void => {
      animateChange(() => {
        if (active.current && generation.current === requestGeneration) setNoticeMsg(message)
      })
    }
    updateNotice('')
    const repos: Repo[] = await getActionRepositories(api, force)
    updateNotice(getActionRepositoryNotice(api))
    return repos
  }, [api])
  const result: ReturnType<typeof useLoadList<Repo>> = useLoadList(fetcher)
  return { ...result, noticeMsg }
}
