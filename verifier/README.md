# Pistols at Dawn Verifier

## Starkscan

* [Submission form](https://docs.google.com/forms/d/e/1FAIpQLSdqBJ311bP7VdYanA4S778LzWS0c_6nEi0yeaeCRvTM9cJPaA/viewform)
* [CLI verifyer](https://github.com/NethermindEth/starknet-contract-verifier)

> WIP, waiting for Dojo snforge support

## Voyager

* [Submission form](https://docs.google.com/forms/d/e/1FAIpQLSfC1MfNJMviRPARsVSZd68luyXUuPfuxPcSWK7Et4SP52733Q/viewform)
* [CLI verifyer](https://github.com/NethermindEth/voyager-verifier)

Install dependencies:

```sh
asdf plugin add voyager https://github.com/NethermindEth/asdf-voyager-verifier.git
asdf install voyager latest
```

Verify all contracts:

```sh
pnpm verify-voyager
```
