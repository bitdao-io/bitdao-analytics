import serverlessExpress from '@vendia/serverless-express'
import {NewAPI} from '../api'
import newConfigFromEnv from '../config'
import newConnections from '../connections'

let server: any

function handler(event: any, context: any) {
    if (!server) {
        const conns = newConnections(newConfigFromEnv())
        server = serverlessExpress({app: NewAPI(conns.ddb)})
    }
    return server(event, context)
}

exports.handler = handler
