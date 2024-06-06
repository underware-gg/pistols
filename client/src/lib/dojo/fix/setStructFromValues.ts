import { getContractByName } from "@dojoengine/core";
import { feltToString } from "@/lib/utils/starknet";

export const setStructFromValues = (manifest: any, structName: string, values: bigint[]): any => {
  const contract = getContractByName(manifest, 'actions');
  // console.log(`CONTRACT,`, contract)
  const structType = getStructTypeByName(contract.abi, structName)
  // console.log(`structType,`, structType)
  const structData = structType.members.reduce((acc: any, t: any, index: number) => {
    const bi = BigInt(values[index] ?? 0);
    const value = nameEqualsTo(t.type, 'bool') ? Boolean(bi)
      : nameEqualsTo(t.type, 'felt252') ? feltToString(bi)
        : nameEqualsTo(t.type, ['u8', 'u16', 'u32', 'u64']) ? Number(bi)
          : bi
    return {
      ...acc,
      [t.name]: value,
    }
  }, {} as any);
  // console.log(`structData:`, structData)
  return structData
}

export const getStructTypeByName = (abi: any, name: string) => {
  return abi.find((type: any) => {
    if (type.type != 'struct') return false
    return nameEqualsTo(type.name, name);
  });
}

export const getEventTypeByName = (abi: any, name: string) => {
  return abi.find((type: any) => {
    if (type.type != 'event') return false
    return nameEqualsTo(type.name, name);
  });
}

export const nameEqualsTo = (name: string, to: string | string[]) => {
  if (Array.isArray(to)) {
    for (const _to of to) {
      if (nameEqualsTo(name, _to)) return true
    }
    return false
  } else {
    const nameParts = name.split("::");
    return (name == to || nameParts[nameParts.length - 1] === to);
  }
}
