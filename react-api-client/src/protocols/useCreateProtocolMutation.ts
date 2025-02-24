import {
  UseMutationResult,
  UseMutationOptions,
  useMutation,
  UseMutateFunction,
  useQueryClient,
} from 'react-query'
import { createProtocol } from '@opentrons/api-client'
import { useHost } from '../api'
import type { AxiosError } from 'axios'
import type { ErrorResponse, HostConfig, Protocol } from '@opentrons/api-client'

export interface CreateProtocolVariables {
  files: File[]
  protocolKey?: string
}
export type UseCreateProtocolMutationResult = UseMutationResult<
  Protocol,
  AxiosError<ErrorResponse>,
  CreateProtocolVariables
> & {
  createProtocol: UseMutateFunction<
    Protocol,
    AxiosError<ErrorResponse>,
    CreateProtocolVariables
  >
}

export type UseCreateProtocolMutationOptions = UseMutationOptions<
  Protocol,
  AxiosError<ErrorResponse>,
  CreateProtocolVariables
>

export function useCreateProtocolMutation(
  options: UseCreateProtocolMutationOptions = {}
): UseCreateProtocolMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    Protocol,
    AxiosError<ErrorResponse>,
    CreateProtocolVariables
  >(
    [host, 'protocols'],
    ({ files: protocolFiles, protocolKey }) =>
      createProtocol(host as HostConfig, protocolFiles, protocolKey).then(
        response => {
          const protocolId = response.data.data.id
          queryClient
            .invalidateQueries([host, 'protocols'])
            .then(() =>
              queryClient.setQueryData(
                [host, 'protocols', protocolId],
                response.data
              )
            )
            .catch(e => {
              console.error(e)
            })
          return response.data
        }
      ),
    options
  )
  return {
    ...mutation,
    createProtocol: mutation.mutate,
  }
}
