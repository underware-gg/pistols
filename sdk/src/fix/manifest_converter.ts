/**
 * Converts a Dojo manifest from Sozo 1.8 format to Sozo 1.7 format.
 * 
 * Main differences:
 * - 1.8 has a top-level "abis" array
 * - 1.7 has "abi" arrays nested in "world" and each "contract"
 * 
 * The function distributes ABIs from the top-level array to:
 * - World: World-related types (dojo::world::*, dojo::model::*, etc.) and core types
 * - Contracts: Contract-specific types (namespace::*) and common types
 * 
 * @param source - The manifest in Sozo 1.8 format
 * @returns The manifest in Sozo 1.7 format
 */
export const convert_dojo_manifest_1_8_to_1_7 = (source: any): any => {
  const result = JSON.parse(JSON.stringify(source)); // Deep clone
  
  // Extract all ABIs from the top-level abis array
  const allAbis = result.abis || [];
  
  // Extract namespace from each contract tag (e.g., "bauhash-minter" -> "bauhash")
  const contractNamespaces: Array<{ contract: any; namespace: string }> = (result.contracts || []).map((contract: any) => {
    const tag = contract.tag || '';
    const namespace = tag.split('-')[0];
    return { contract, namespace };
  });
  
  // Helper function to check if an ABI belongs to a specific namespace
  const belongsToNamespace = (abi: any, namespace: string): boolean => {
    if (!abi.name) return false;
    return abi.name.startsWith(`${namespace}::`);
  };
  
  // Helper function to check if an ABI is world-related
  const isWorldAbi = (abi: any): boolean => {
    if (!abi.name) {
      // Check interface_name for impl types
      if (abi.type === 'impl' && abi.interface_name) {
        return abi.interface_name.startsWith('dojo::world::');
      }
      // Check for constructor
      if (abi.type === 'constructor') {
        return true;
      }
      return false;
    }
    
    // World-related prefixes
    if (abi.name.startsWith('dojo::world::')) return true;
    if (abi.name.startsWith('dojo::model::metadata::')) return true;
    if (abi.name.startsWith('dojo::model::definition::')) return true;
    if (abi.name.startsWith('dojo::meta::')) return true;
    if (abi.name.startsWith('dojo::event::')) return true;
    if (abi.name.startsWith('dojo::world::world_contract::world::')) return true;
    
    // Core types that are used by world
    if (abi.name.startsWith('core::array::Span::')) return true;
    if (abi.name.startsWith('core::byte_array::ByteArray')) return true;
    if (abi.name.startsWith('core::bool')) return true;
    if (abi.name.startsWith('core::option::')) return true;
    if (abi.name.startsWith('core::integer::u256')) return true;
    if (abi.name.startsWith('core::integer::u32')) return true;
    if (abi.name.startsWith('core::integer::u8')) return true;
    if (abi.name.startsWith('core::integer::u64')) return true;
    if (abi.name.startsWith('core::integer::u128')) return true;
    if (abi.name.startsWith('dojo::world::resource::')) return true;
    if (abi.name.startsWith('dojo::world::iworld::')) return true;
    
    // Check interface_name for impl types
    if (abi.type === 'impl' && abi.interface_name) {
      return abi.interface_name.startsWith('dojo::world::');
    }
    
    return false;
  };
  
  // Helper function to check if an ABI is a common/core type that contracts might need
  const isCommonType = (abi: any): boolean => {
    if (!abi.name) return false;
    
    // Core types
    if (abi.name.startsWith('core::byte_array::ByteArray')) return true;
    if (abi.name.startsWith('core::integer::')) return true;
    if (abi.name.startsWith('core::bool')) return true;
    if (abi.name.startsWith('core::option::')) return true;
    if (abi.name.startsWith('core::array::Span::')) return true;
    if (abi.name.startsWith('core::starknet::')) return true;
    
    // Dojo component types
    if (abi.name.startsWith('dojo::contract::components::')) return true;
    if (abi.name.startsWith('dojo::contract::interface::')) return true;
    if (abi.name.startsWith('dojo::meta::interface::')) return true;
    if (abi.name.startsWith('dojo::world::iworld::IWorldDispatcher')) return true;
    
    // OpenZeppelin and NFT combo types
    if (abi.name.startsWith('openzeppelin_')) return true;
    if (abi.name.startsWith('nft_combo::')) return true;
    
    return false;
  };
  
  // Separate ABIs into world and contract-specific
  const worldAbis: any[] = [];
  const contractAbisMap = new Map<string, any[]>();
  
  // Initialize contract ABI arrays
  contractNamespaces.forEach(({ contract, namespace }) => {
    contractAbisMap.set(namespace, []);
  });
  
  // Distribute ABIs
  for (const abi of allAbis) {
    let assignedToContract = false;
    let assignedToWorld = false;
    
    // Check if it belongs to a contract namespace
    for (const { namespace } of contractNamespaces) {
      if (belongsToNamespace(abi, namespace)) {
        contractAbisMap.get(namespace)!.push(abi);
        assignedToContract = true;
        break;
      }
    }
    
    // Check if it's world-related (this can be true even if also a common type)
    if (isWorldAbi(abi)) {
      worldAbis.push(abi);
      assignedToWorld = true;
    }
    
    // Check if it's a common type that contracts need
    // Common types go to both world and contracts
    if (isCommonType(abi)) {
      contractNamespaces.forEach(({ namespace }: { namespace: string }) => {
        contractAbisMap.get(namespace)!.push(abi);
      });
      assignedToContract = true;
    }
    
    // If not assigned to a contract yet, check if it references a contract namespace
    if (!assignedToContract) {
      const abiString = JSON.stringify(abi);
      for (const { namespace } of contractNamespaces) {
        if (abiString.includes(`${namespace}::`)) {
          contractAbisMap.get(namespace)!.push(abi);
          assignedToContract = true;
          break;
        }
      }
    }
    
    // If not assigned to world or contract, add to world as fallback
    if (!assignedToWorld && !assignedToContract) {
      worldAbis.push(abi);
    }
  }
  
  // Add world ABI
  result.world.abi = worldAbis;
  
  // Add contract ABIs
  result.contracts.forEach((contract: any, index: number) => {
    const tag = contract.tag || '';
    const namespace = tag.split('-')[0];
    contract.abi = contractAbisMap.get(namespace) || [];
  });
  
  // Remove the top-level abis array
  delete result.abis;
  
  return result;
};
