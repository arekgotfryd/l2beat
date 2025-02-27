import { Bytes, EthereumAddress } from '@l2beat/shared'
import { expect, mockObject } from 'earl'

import { HandlerExecutor } from '../handlers/HandlerExecutor'
import { DiscoveryProvider } from '../provider/DiscoveryProvider'
import { ProxyDetector } from '../proxies/ProxyDetector'
import { ContractSources, SourceCodeService } from '../source/SourceCodeService'
import { DiscoveryLogger } from '../utils/DiscoveryLogger'
import { AddressAnalyzer } from './AddressAnalyzer'

describe(AddressAnalyzer.name, () => {
  it('handles EOAs', async () => {
    const addressAnalyzer = new AddressAnalyzer(
      mockObject<DiscoveryProvider>({
        getCode: async () => Bytes.EMPTY,
      }),
      mockObject<ProxyDetector>(),
      mockObject<SourceCodeService>(),
      mockObject<HandlerExecutor>(),
      DiscoveryLogger.SILENT,
    )

    const address = EthereumAddress.random()
    const result = await addressAnalyzer.analyze(address, undefined)

    expect(result).toEqual({
      analysis: { type: 'EOA', address },
      relatives: [],
    })
  })

  it('handles contracts', async () => {
    const address = EthereumAddress.random()
    const implementation = EthereumAddress.random()
    const admin = EthereumAddress.random()
    const owner = EthereumAddress.random()

    const sources: ContractSources = {
      name: 'Test',
      isVerified: true,
      abi: ['function foo()', 'function bar()'],
      abis: {
        [address.toString()]: ['function foo()'],
        [implementation.toString()]: ['function bar()'],
      },
      files: [
        { 'Foo.sol': 'contract Test { function foo() {} }' },
        { 'Bar.sol': 'contract Test { function bar() {} }' },
      ],
    }

    const addressAnalyzer = new AddressAnalyzer(
      mockObject<DiscoveryProvider>({
        getCode: async () => Bytes.fromHex('0x1234'),
      }),
      mockObject<ProxyDetector>({
        detectProxy: async () => ({
          upgradeability: {
            type: 'EIP1967 proxy',
            implementation,
            admin,
          },
          implementations: [implementation],
          relatives: [admin],
        }),
      }),
      mockObject<SourceCodeService>({
        getSources: async () => sources,
      }),
      mockObject<HandlerExecutor>({
        execute: async () => ({
          results: [{ field: 'owner', value: owner.toString() }],
          values: { owner: owner.toString() },
          errors: undefined,
        }),
      }),
      DiscoveryLogger.SILENT,
    )

    const result = await addressAnalyzer.analyze(address, undefined)

    expect(result).toEqual({
      analysis: {
        type: 'Contract',
        name: 'Test',
        address,
        code: `https://etherscan.deth.net/address/${address.toString()},${implementation.toString()}`,
        unverified: undefined,
        upgradeability: { type: 'EIP1967 proxy', implementation, admin },
        values: { owner: owner.toString() },
        errors: undefined,
        sources,
      },
      relatives: [owner, admin],
    })
  })

  it('handles unverified contracts', async () => {
    const address = EthereumAddress.random()
    const implementation = EthereumAddress.random()
    const admin = EthereumAddress.random()
    const owner = EthereumAddress.random()

    const sources: ContractSources = {
      name: 'Test',
      isVerified: false,
      abi: ['function foo()'],
      abis: {
        [address.toString()]: ['function foo()'],
      },
      files: [{ 'Foo.sol': 'contract Test { function foo() {} }' }, {}],
    }

    const addressAnalyzer = new AddressAnalyzer(
      mockObject<DiscoveryProvider>({
        getCode: async () => Bytes.fromHex('0x1234'),
      }),
      mockObject<ProxyDetector>({
        detectProxy: async () => ({
          upgradeability: {
            type: 'EIP1967 proxy',
            implementation,
            admin,
          },
          implementations: [implementation],
          relatives: [admin],
        }),
      }),
      mockObject<SourceCodeService>({
        getSources: async () => sources,
      }),
      mockObject<HandlerExecutor>({
        execute: async () => ({
          results: [{ field: 'owner', value: owner.toString() }],
          values: { owner: owner.toString() },
          errors: undefined,
        }),
      }),
      DiscoveryLogger.SILENT,
    )

    const result = await addressAnalyzer.analyze(address, undefined)

    expect(result).toEqual({
      analysis: {
        type: 'Contract',
        name: 'Test',
        address,
        code: `https://etherscan.deth.net/address/${address.toString()},${implementation.toString()}`,
        unverified: true,
        upgradeability: { type: 'EIP1967 proxy', implementation, admin },
        values: { owner: owner.toString() },
        errors: undefined,
        sources,
      },
      relatives: [owner, admin],
    })
  })
})
