/**
 * Calculates a Data Quality Score (0 to 100) based on master data completeness,
 * formatting standards, and attribute validation.
 */
function calculateQualityScore(entityType, record) {
  let score = 0;
  const attributes = typeof record.attributes === 'string'
    ? safeJsonParse(record.attributes, {})
    : (record.attributes || {});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s+\-()]{7,20}$/;

  if (entityType === 'product') {
    // 1. Code / SKU format
    if (record.code && record.code.trim().length >= 3) score += 20;
    // 2. Name clarity
    if (record.name && record.name.trim().length >= 3) score += 20;
    // 3. Category assigned
    if (record.category && record.category.trim().length > 0) score += 15;
    // 4. Price attribute valid
    const price = parseFloat(attributes.price);
    if (!isNaN(price) && price > 0) score += 15;
    // 5. Unit / Stock attribute valid
    if (attributes.unit && attributes.unit.trim().length > 0) score += 15;
    // 6. Description detail
    if (record.description && record.description.trim().length >= 10) score += 15;
  } else if (entityType === 'supplier') {
    // 1. Code
    if (record.code && record.code.trim().length >= 3) score += 20;
    // 2. Name
    if (record.name && record.name.trim().length >= 3) score += 20;
    // 3. Email validation
    if (attributes.email && emailRegex.test(attributes.email.trim())) score += 20;
    else if (attributes.email && attributes.email.includes('@')) score += 10;
    // 4. Phone presence
    if (attributes.phone && phoneRegex.test(attributes.phone.trim())) score += 15;
    // 5. Country / Region
    if (attributes.country && attributes.country.trim().length > 0) score += 15;
    // 6. Tax / Reg ID
    if (attributes.taxId && attributes.taxId.trim().length > 0) score += 10;
  } else if (entityType === 'customer') {
    // 1. Code / Account
    if (record.code && record.code.trim().length >= 3) score += 20;
    // 2. Name
    if (record.name && record.name.trim().length >= 3) score += 20;
    // 3. Email validation
    if (attributes.email && emailRegex.test(attributes.email.trim())) score += 20;
    else if (attributes.email && attributes.email.includes('@')) score += 10;
    // 4. Segment
    if (record.category && record.category.trim().length > 0) score += 15;
    // 5. Phone or Region
    if ((attributes.phone && attributes.phone.trim().length > 0) || (attributes.region && attributes.region.trim().length > 0)) score += 15;
    // 6. Lifetime Value or Tier
    if (attributes.lifetimeValue !== undefined && attributes.lifetimeValue !== '') score += 10;
  } else {
    // Generic entity
    if (record.code) score += 30;
    if (record.name) score += 40;
    if (record.description) score += 30;
  }

  return Math.min(100, Math.max(0, score));
}

function safeJsonParse(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

module.exports = {
  calculateQualityScore,
  safeJsonParse
};
