import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidateRoot = path.join(root, "public", "catalog", "02_ecommerce_candidate_images");
const pageRoot = path.join(root, "public", "catalog", "03_page_renders_preview");
const outJson = path.join(root, "src", "data", "catalog-manifest.json");
const outSql = path.join(root, "supabase", "seed", "catalog_seed.sql");

const categoryNames = {
  brady_labels_marking: "Brady Labels & Marking",
  cable_trays: "Cable Trays",
  distribution_panels: "Electric Distribution Panels",
  electrical_accessories: "Electrical Accessories",
  fire_fighting_cabinets: "Fire Fighting Cabinets",
  industrial_sockets_contactors: "Industrial Sockets & Contactors",
  locker_cabinets: "Locker Cabinets",
  safety_products: "Safety Products",
  smart_panels_ont_onu: "Smart Panels (ONU / ONT)",
  solar_lighting: "Solar Lighting",
  terminal_blocks_instruments: "Terminal Blocks & Instruments"
};

const categoryDescriptions = {
  brady_labels_marking: "Cable identification, labels, marking products, and electrical labeling systems.",
  cable_trays: "Cable tray fittings and metal routing systems for industrial installations.",
  distribution_panels: "Designed and assembled electrical distribution, control, and ATS panels.",
  electrical_accessories: "Cable ties, wiring accessories, control accessories, and related electrical supplies.",
  fire_fighting_cabinets: "Fire fighting cabinets, alarms, safety boxes, and fire system equipment references.",
  industrial_sockets_contactors: "Industrial sockets, contactors, timers, plugs, and control components.",
  locker_cabinets: "Locker cabinet solutions for workplaces, projects, and facility operations.",
  safety_products: "Safety footwear and personal safety product references.",
  smart_panels_ont_onu: "Smart telecom panels and ONU/ONT enclosure products.",
  solar_lighting: "Solar street lighting, flood lights, and solar-powered outdoor lighting systems.",
  terminal_blocks_instruments: "Terminal blocks, meters, timers, transducers, and measuring instruments."
};

const categoryImageOverrides = {
  brady_labels_marking: "p50_img06_brady_labels_marking_474x312.jpeg",
  cable_trays: "p34_img02_cable_trays_669x465.png",
  distribution_panels: "p06_img07_distribution_panels_759x433.jpeg",
  electrical_accessories: "p57_img11_electrical_accessories_600x600.jpeg",
  fire_fighting_cabinets: "p26_img03_fire_fighting_cabinets_1309x984.jpeg",
  industrial_sockets_contactors: "p86_img04_industrial_sockets_contactors_477x304.jpeg",
  locker_cabinets: "p33_img03_locker_cabinets_502x628.jpeg",
  safety_products: "p96_img03_safety_products_1401x990.jpeg",
  smart_panels_ont_onu: "p20_img03_smart_panels_ont_onu_471x460.jpeg",
  solar_lighting: "p41_img04_solar_lighting_452x324.jpeg",
  terminal_blocks_instruments: "p76_img01_terminal_blocks_instruments_533x623.jpeg"
};

const excludedProductImages = new Set([
  "brady_labels_marking/p50_img05_brady_labels_marking_853x736.jpeg",
  "cable_trays/p34_img07_cable_trays_993x149.png",
  "electrical_accessories/p57_img01_electrical_accessories_709x389.png",
  "electrical_accessories/p57_img10_electrical_accessories_541x336.jpeg",
  "fire_fighting_cabinets/p25_img04_fire_fighting_cabinets_513x513.jpeg",
  "fire_fighting_cabinets/p25_img07_fire_fighting_cabinets_948x180.png",
  "fire_fighting_cabinets/p25_img08_fire_fighting_cabinets_730x409.jpeg",
  "fire_fighting_cabinets/p27_img01_fire_fighting_cabinets_950x950.jpeg",
  "fire_fighting_cabinets/p27_img04_fire_fighting_cabinets_917x660.jpeg",
  "fire_fighting_cabinets/p27_img05_fire_fighting_cabinets_565x752.jpeg",
  "fire_fighting_cabinets/p30_img03_fire_fighting_cabinets_862x238.jpeg"
]);

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleFromCategory(category) {
  return categoryNames[category] ?? category.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function publicPath(filePath) {
  return `/${path.relative(path.join(root, "public"), filePath).replaceAll(path.sep, "/")}`;
}

function parseImageMeta(filename) {
  const pageMatch = filename.match(/^p(\d+)_img(\d+)/i);
  const sizeMatch = filename.match(/_(\d+)x(\d+)\.[^.]+$/i);
  return {
    sourcePage: pageMatch ? Number(pageMatch[1]) : null,
    imageNumber: pageMatch ? Number(pageMatch[2]) : null,
    width: sizeMatch ? Number(sizeMatch[1]) : 800,
    height: sizeMatch ? Number(sizeMatch[2]) : 600
  };
}

function isDisplayableProductImage(filename) {
  const meta = parseImageMeta(filename);
  const wideRatio = Math.max(meta.width / meta.height, meta.height / meta.width);

  return wideRatio <= 4.2 && meta.width >= 180 && meta.height >= 180;
}

function sql(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${String(value).replaceAll("'", "''")}'`;
}

if (!existsSync(candidateRoot)) {
  throw new Error(`Missing catalog source folder: ${candidateRoot}`);
}

const categories = [];
const products = [];

const folders = readdirSync(candidateRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => titleFromCategory(a).localeCompare(titleFromCategory(b)));

for (const [categoryIndex, folder] of folders.entries()) {
  const folderPath = path.join(candidateRoot, folder);
  const files = readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .filter((filename) => !excludedProductImages.has(`${folder}/${filename}`))
    .filter(isDisplayableProductImage)
    .sort();
  const categoryImage = categoryImageOverrides[folder] && files.includes(categoryImageOverrides[folder])
    ? categoryImageOverrides[folder]
    : files[0];

  const category = {
    id: slugify(folder),
    slug: slugify(folder),
    sourceFolder: folder,
    name: titleFromCategory(folder),
    description: categoryDescriptions[folder] ?? "Industrial catalog products and references.",
    imagePath: categoryImage ? publicPath(path.join(folderPath, categoryImage)) : null,
    productCount: files.length,
    sortOrder: categoryIndex
  };
  categories.push(category);

  files.forEach((filename, fileIndex) => {
    const meta = parseImageMeta(filename);
    const baseSlug = slugify(filename.replace(/\.[^.]+$/, ""));
    const slug = `${category.slug}-${baseSlug}`;
    products.push({
      id: slug,
      slug,
      categorySlug: category.slug,
      categoryName: category.name,
      name: `${category.name} ${String(fileIndex + 1).padStart(2, "0")}`,
      summary: category.description,
      imagePath: publicPath(path.join(folderPath, filename)),
      sourceFolder: folder,
      sourceFilename: filename,
      sourcePage: meta.sourcePage,
      imageNumber: meta.imageNumber,
      width: meta.width,
      height: meta.height,
      sortOrder: fileIndex
    });
  });
}

const catalogPages = existsSync(pageRoot)
  ? readdirSync(pageRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => {
        const match = entry.name.match(/page_(\d+)/i);
        const pageNumber = match ? Number(match[1]) : 0;
        return {
          id: `page-${String(pageNumber).padStart(2, "0")}`,
          pageNumber,
          title: `Catalog Page ${String(pageNumber).padStart(2, "0")}`,
          imagePath: publicPath(path.join(pageRoot, entry.name)),
          width: 720,
          height: 405
        };
      })
      .sort((a, b) => a.pageNumber - b.pageNumber)
  : [];

const manifest = {
  generatedAt: new Date().toISOString(),
  categories,
  products,
  catalogPages,
  totals: {
    categories: categories.length,
    products: products.length,
    catalogPages: catalogPages.length
  }
};

mkdirSync(path.dirname(outJson), { recursive: true });
writeFileSync(outJson, `${JSON.stringify(manifest, null, 2)}\n`);

const categoryRows = categories
  .map((category) => `(${sql(category.name)}, ${sql(category.slug)}, ${sql(category.description)}, ${sql(category.imagePath)}, ${sql(category.sortOrder)}, true)`)
  .join(",\n  ");

const productRows = products
  .map((product) => `(${sql(product.categorySlug)}, ${sql(product.name)}, ${sql(product.slug)}, ${sql(product.summary)}, ${sql(product.sourcePage)}, ${sql(product.sourceFolder)}, ${sql(product.sortOrder)}, true)`)
  .join(",\n  ");

const imageRows = products
  .map((product) => `(${sql(product.slug)}, ${sql("local-public")}, ${sql(product.imagePath)}, ${sql(`${product.name} product image`)}, ${sql(product.sourceFolder)}, ${sql(product.sourceFilename)}, ${sql(product.sourcePage)}, ${sql(product.width)}, ${sql(product.height)}, true, 0)`)
  .join(",\n  ");

const sqlText = `-- Generated by scripts/generate-catalog.mjs. Review before applying.\n\ninsert into public.categories (name, slug, description, image_path, sort_order, is_published)\nvalues\n  ${categoryRows}\non conflict (slug) do update\nset name = excluded.name,\n    description = excluded.description,\n    image_path = excluded.image_path,\n    sort_order = excluded.sort_order,\n    is_published = excluded.is_published,\n    updated_at = now();\n\ninsert into public.products (category_id, name, slug, summary, source_page, source_category, sort_order, is_published)\nselect c.id, v.name, v.slug, v.summary, v.source_page, v.source_category, v.sort_order, v.is_published\nfrom (values\n  ${productRows}\n) as v(category_slug, name, slug, summary, source_page, source_category, sort_order, is_published)\njoin public.categories c on c.slug = v.category_slug\non conflict (slug) do update\nset category_id = excluded.category_id,\n    name = excluded.name,\n    summary = excluded.summary,\n    source_page = excluded.source_page,\n    source_category = excluded.source_category,\n    sort_order = excluded.sort_order,\n    is_published = excluded.is_published,\n    updated_at = now();\n\ndelete from public.product_images where bucket_id = 'local-public';\n\ninsert into public.product_images (product_id, bucket_id, file_path, alt_text, source_folder, source_filename, source_page, width_px, height_px, is_primary, sort_order)\nselect p.id, v.bucket_id, v.file_path, v.alt_text, v.source_folder, v.source_filename, v.source_page, v.width_px, v.height_px, v.is_primary, v.sort_order\nfrom (values\n  ${imageRows}\n) as v(product_slug, bucket_id, file_path, alt_text, source_folder, source_filename, source_page, width_px, height_px, is_primary, sort_order)\njoin public.products p on p.slug = v.product_slug;\n`;

mkdirSync(path.dirname(outSql), { recursive: true });
writeFileSync(outSql, sqlText);

console.log(`Generated ${products.length} product items across ${categories.length} categories.`);
console.log(`Wrote ${path.relative(root, outJson)}`);
console.log(`Wrote ${path.relative(root, outSql)}`);
