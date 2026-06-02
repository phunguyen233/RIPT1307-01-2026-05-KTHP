import { Unit } from "../api/unitAPI";
import { Ingredient } from "../api/ingredientAPI";

/**
 * Tìm unit cơ sở (base unit) của một unit
 * Nếu base_unit_id = null thì đây là unit cơ sở
 */
export function findBaseUnit(unit: Unit, allUnits: Unit[]): Unit {
  if (!unit.base_unit_id) {
    return unit;
  }
  const baseUnit = allUnits.find(u => u.id === unit.base_unit_id);
  if (!baseUnit) {
    return unit;
  }
  return findBaseUnit(baseUnit, allUnits);
}

/**
 * Tính conversion factor từ unit A sang unit B
 * Nếu không thể convert (khác loại) trả về null
 * 
 * Ví dụ:
 * - convertBetweenUnits(unit_gram, unit_kilogram) = 0.001 (1g = 0.001kg)
 * - convertBetweenUnits(unit_kilogram, unit_gram) = 1000 (1kg = 1000g)
 */
export function convertBetweenUnits(
  fromUnit: Unit,
  toUnit: Unit,
  allUnits: Unit[]
): number | null {
  // Tìm unit cơ sở
  const fromBase = findBaseUnit(fromUnit, allUnits);
  const toBase = findBaseUnit(toUnit, allUnits);

  // Nếu khác loại unit không thể convert
  if (fromBase.id !== toBase.id) {
    return null;
  }

  // Tính conversion factor từ fromUnit -> fromBase
  let fromToBaseFactor = 1;
  let current = fromUnit;
  while (current.base_unit_id) {
    const baseUnit = allUnits.find(u => u.id === current.base_unit_id);
    if (baseUnit) {
      fromToBaseFactor *= (current.conversion_factor || 1);
      current = baseUnit;
    } else {
      break;
    }
  }

  // Tính conversion factor từ toBase -> toUnit (reverse)
  let baseToToFactor = 1;
  let currentTo = toUnit;
  while (currentTo.base_unit_id) {
    const baseUnit = allUnits.find(u => u.id === currentTo.base_unit_id);
    if (baseUnit) {
      baseToToFactor *= (currentTo.conversion_factor || 1);
      currentTo = baseUnit;
    } else {
      break;
    }
  }

  // Conversion factor = từ->base / base->to
  return fromToBaseFactor / baseToToFactor;
}

/**
 * Convert quantity từ một unit sang unit khác
 * Trả về null nếu không thể convert
 */
export function convertQuantity(
  quantity: number,
  fromUnit: Unit,
  toUnit: Unit,
  allUnits: Unit[]
): number | null {
  if (fromUnit.id === toUnit.id) {
    return quantity;
  }

  const factor = convertBetweenUnits(fromUnit, toUnit, allUnits);
  if (factor === null) {
    return null;
  }

  return quantity * factor;
}

/**
 * Tính cost nguyên liệu dựa trên quantity, unit, ingredient, và tất cả units
 * 
 * Logic:
 * 1. Convert quantity từ recipe_unit sang ingredient_unit
 * 2. Tính cost = quantity_in_ingredient_unit * ingredient.avg_price
 */
export function calculateIngredientCost(
  quantity: number,
  recipeUnit: Unit,
  ingredient: Ingredient & { unit_id: number },
  ingredientUnit: Unit,
  allUnits: Unit[]
): number {
  // Convert quantity sang unit của ingredient
  const convertedQuantity = convertQuantity(quantity, recipeUnit, ingredientUnit, allUnits);
  
  if (convertedQuantity === null) {
    // Không thể convert (khác loại unit)
    console.warn(
      `Cannot convert ${recipeUnit.symbol} to ${ingredientUnit.symbol}`,
      `(types: ${recipeUnit.type} vs ${ingredientUnit.type})`
    );
    return 0;
  }

  // Tính cost
  return convertedQuantity * (ingredient.avg_price || 0);
}
