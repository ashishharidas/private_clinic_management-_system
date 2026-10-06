const Doctor = require("../models/Doctor");

/**
 * Generate a unique slug from a doctor's name.
 * Example: "Dr. Jane Smith" -> "jane-smith"
 * If conflict, appends a number: "jane-smith-2"
 */
async function generateUniqueSlug(name, excludeId = null) {
  const base = name
    .toLowerCase()
    .replace(/dr\.?\s*/i, "") // strip "dr" / "dr."
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric -> dash
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .substring(0, 50);

  if (!base) {
    return `doctor-${Date.now()}`;
  }

  let slug = base;
  let counter = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };

    const exists = await Doctor.findOne(query).select("_id").lean();
    if (!exists) break;

    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}

module.exports = { generateUniqueSlug };