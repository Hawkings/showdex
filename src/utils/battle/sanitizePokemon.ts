import { PokemonNatures } from '@showdex/consts';
import { calcPokemonCalcdexId, calcPokemonCalcdexNonce } from '@showdex/utils/calc';
import type { AbilityName, ItemName, MoveName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';
import { detectToggledAbility } from './detectToggledAbility';
// import { sanitizeSpeciesForme } from './sanitizeSpeciesForme';

/**
 * Essentially converts a `Showdown.Pokemon` into our custom `CalcdexPokemon`.
 *
 * * Gets in *R E A L / D E E P*.
 *   - Sanitizes the living shit out of the `pokemon`.
 * * You can also pass in an incomplete `CalcdexPokemon`,
 *   which will fill in defaults for any missing properties.
 *   - Technically, nothing is required, so you can pass in no arguments and
 *     still get a partially filled-in `CalcdexPokemon`.
 *
 * @since 0.1.0
 */
export const sanitizePokemon = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon> = {},
): CalcdexPokemon => {
  const sanitizedPokemon: CalcdexPokemon = {
    calcdexId: ('calcdexId' in pokemon && pokemon.calcdexId) || null,
    calcdexNonce: ('calcdexNonce' in pokemon && pokemon.calcdexNonce) || null,

    slot: pokemon?.slot ?? null, // could be 0, so don't use logical OR here
    ident: detectPokemonIdent(pokemon),
    searchid: pokemon?.searchid,
    speciesForme: detectSpeciesForme(pokemon),
    rawSpeciesForme: pokemon?.speciesForme,

    name: pokemon?.name,
    details: pokemon?.details,
    level: pokemon?.level || 0,
    gender: pokemon?.gender,
    shiny: pokemon?.shiny,

    types: pokemon?.volatiles?.typechange ?
      [<Showdown.TypeName> pokemon.volatiles.typechange[1]] :
      ('types' in pokemon && pokemon.types) || [],

    ability: <AbilityName> pokemon?.ability || ('abilities' in pokemon && pokemon.abilities[0]) || null,
    dirtyAbility: ('dirtyAbility' in pokemon && pokemon.dirtyAbility) || null,
    abilityToggled: 'abilityToggled' in pokemon ? pokemon.abilityToggled : detectToggledAbility(pokemon),
    baseAbility: <AbilityName> pokemon?.baseAbility,
    abilities: ('abilities' in pokemon && pokemon.abilities) || [],
    altAbilities: ('altAbilities' in pokemon && pokemon.altAbilities) || [],

    item: <ItemName> pokemon?.item,
    dirtyItem: ('dirtyItem' in pokemon && pokemon.dirtyItem) || null,
    altItems: ('altItems' in pokemon && pokemon.altItems) || [],
    itemEffect: pokemon?.itemEffect,
    prevItem: <ItemName> pokemon?.prevItem,
    prevItemEffect: pokemon?.prevItemEffect,

    nature: ('nature' in pokemon && pokemon.nature) || PokemonNatures[0],

    ivs: {
      hp: ('ivs' in pokemon && pokemon.ivs?.hp) ?? 31,
      atk: ('ivs' in pokemon && pokemon.ivs?.atk) ?? 31,
      def: ('ivs' in pokemon && pokemon.ivs?.def) ?? 31,
      spa: ('ivs' in pokemon && pokemon.ivs?.spa) ?? 31,
      spd: ('ivs' in pokemon && pokemon.ivs?.spd) ?? 31,
      spe: ('ivs' in pokemon && pokemon.ivs?.spe) ?? 31,
    },

    evs: {
      hp: ('evs' in pokemon && pokemon.evs?.hp) ?? 0,
      atk: ('evs' in pokemon && pokemon.evs?.atk) ?? 0,
      def: ('evs' in pokemon && pokemon.evs?.def) ?? 0,
      spa: ('evs' in pokemon && pokemon.evs?.spa) ?? 0,
      spd: ('evs' in pokemon && pokemon.evs?.spd) ?? 0,
      spe: ('evs' in pokemon && pokemon.evs?.spe) ?? 0,
    },

    boosts: {
      atk: typeof pokemon?.boosts?.atk === 'number' ? pokemon.boosts.atk : 0,
      def: typeof pokemon?.boosts?.def === 'number' ? pokemon.boosts.def : 0,
      spa: typeof pokemon?.boosts?.spa === 'number' ? pokemon.boosts.spa : 0,
      spd: typeof pokemon?.boosts?.spd === 'number' ? pokemon.boosts.spd : 0,
      spe: typeof pokemon?.boosts?.spe === 'number' ? pokemon.boosts.spe : 0,
    },

    dirtyBoosts: {
      atk: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.atk) || undefined,
      def: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.def) || undefined,
      spa: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.spa) || undefined,
      spd: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.spd) || undefined,
      spe: ('dirtyBoosts' in pokemon && pokemon.dirtyBoosts?.spe) || undefined,
    },

    status: pokemon?.status,
    statusData: {
      sleepTurns: pokemon?.statusData?.sleepTurns || 0,
      toxicTurns: pokemon?.statusData?.toxicTurns || 0,
    },

    volatiles: pokemon?.volatiles,
    turnstatuses: pokemon?.turnstatuses,
    toxicCounter: pokemon?.statusData?.toxicTurns,

    hp: pokemon?.hp || 0,
    maxhp: pokemon?.maxhp || 1,
    fainted: pokemon?.fainted || !pokemon?.hp,

    moves: <MoveName[]> pokemon?.moves || [],
    altMoves: ('altMoves' in pokemon && pokemon.altMoves) || [],
    useUltimateMoves: ('useUltimateMoves' in pokemon && pokemon.useUltimateMoves) || false,
    lastMove: pokemon?.lastMove,
    moveTrack: Array.isArray(pokemon?.moveTrack) ?
      // since pokemon.moveTrack is an array of arrays,
      // we don't want to reference the original inner array elements
      <CalcdexPokemon['moveTrack']> JSON.parse(JSON.stringify(pokemon?.moveTrack)) :
      [],
    moveState: {
      revealed: ('moveState' in pokemon && pokemon.moveState?.revealed) || [],
      learnset: ('moveState' in pokemon && pokemon.moveState?.learnset) || [],
      other: ('moveState' in pokemon && pokemon.moveState?.other) || [],
    },

    criticalHit: ('criticalHit' in pokemon && pokemon.criticalHit) || false,

    preset: ('preset' in pokemon && pokemon.preset) || null,
    presets: ('presets' in pokemon && pokemon.presets) || [],
    autoPreset: 'autoPreset' in pokemon ? pokemon.autoPreset : true,
  };

  // fill in additional info if the Dex global is available (should be)
  if (typeof Dex?.species?.get === 'function') {
    const species = Dex.species.get(sanitizedPokemon.speciesForme);

    // don't really care if species is falsy here
    sanitizedPokemon.baseStats = {
      ...species?.baseStats,
    };

    // only update the types if the dex returned types
    if (Array.isArray(species?.types) && species.types.length) {
      sanitizedPokemon.types = [
        ...(<Showdown.TypeName[]> species.types),
      ];
    }

    // only update the abilities if the dex returned abilities
    if (!sanitizedPokemon.abilities.length && Object.keys(species?.abilities || {}).length) {
      sanitizedPokemon.abilities = [
        ...(<AbilityName[]> Object.values(species.abilities)),
      ];

      if (!sanitizedPokemon.ability) {
        [sanitizedPokemon.ability] = sanitizedPokemon.abilities;
      }
    }
  }

  // remove any non-string volatiles
  // (particularly Ditto's `transformed` volatile, which references an existing Pokemon object as its value)
  Object.entries(sanitizedPokemon.volatiles || {}).forEach(([key, value]) => {
    if (!['string', 'number'].includes(typeof value)) {
      delete sanitizedPokemon.volatiles[key];
    }
  });

  if (!sanitizedPokemon?.calcdexId) {
    sanitizedPokemon.calcdexId = calcPokemonCalcdexId(sanitizedPokemon);
  }

  sanitizedPokemon.calcdexNonce = calcPokemonCalcdexNonce(sanitizedPokemon);

  return sanitizedPokemon;
};
