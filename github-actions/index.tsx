import { Navigation, Script } from 'scripting'
import { App } from './pages/App'

async function run(): Promise<void> {
  await Navigation.present({ element: <App /> })
  Script.exit()
}

run()
