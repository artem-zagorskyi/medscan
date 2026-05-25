"""
Аналіз датасету класифікації медичних досліджень (LOINC-like).

Очікувані колонки:
    mimic_label, common_name, unofficial_name, category, fluid,
    value, valuenum, unit, flag

Запуск:
    python dataset_report.py
"""

import sys
from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt

# ---------------------------------------------------------------------------
# Налаштування
# ---------------------------------------------------------------------------
CSV_PATH = Path("./data/dataset_uk.csv")          
OUTPUT_DIR = Path("report_output")      # сюди збережуться діаграми
OUTPUT_DIR.mkdir(exist_ok=True)

# Шрифт із підтримкою кирилиці (на Windows DejaVu Sans є за замовчуванням)
plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["axes.unicode_minus"] = False


# ---------------------------------------------------------------------------
# Завантаження
# ---------------------------------------------------------------------------
if not CSV_PATH.exists():
    sys.exit(f"❌ Файл не знайдено: {CSV_PATH.resolve()}")

df = pd.read_csv(CSV_PATH)

# Прибираємо пробіли в текстових полях, щоб "Кров " і "Кров" не рахувались окремо
for col in ["common_name", "unofficial_name", "category", "fluid"]:
    if col in df.columns:
        df[col] = df[col].astype(str).str.strip()


# ---------------------------------------------------------------------------
# 1-4. Базова статистика по класах та синонімах
# ---------------------------------------------------------------------------
# Клас = common_name (стандартизована назва).
# Синонім = unique unofficial_name у межах класу
#   (датасет у long-форматі, тому повтори рядків НЕ рахуємо).

synonyms_per_class = (
    df.groupby("common_name")["unofficial_name"]
      .nunique()
      .sort_values(ascending=False)
)

n_classes        = synonyms_per_class.shape[0]
n_synonyms_total = int(synonyms_per_class.sum())
avg_synonyms     = synonyms_per_class.mean()
min_synonyms     = int(synonyms_per_class.min())
max_synonyms     = int(synonyms_per_class.max())

# Який клас має мінімум / максимум — корисно для звіту
class_with_min = synonyms_per_class.idxmin()
class_with_max = synonyms_per_class.idxmax()


# ---------------------------------------------------------------------------
# 5. Розподіл за типом біологічного матеріалу (fluid)
# ---------------------------------------------------------------------------
# Скільки УНІКАЛЬНИХ класів припадає на кожен тип матеріалу.
classes_per_fluid = (
    df.groupby("fluid")["common_name"]
      .nunique()
      .sort_values(ascending=False)
)


# ---------------------------------------------------------------------------
# 6. Розподіл за категорією дослідження (category)
# ---------------------------------------------------------------------------
classes_per_category = (
    df.groupby("category")["common_name"]
      .nunique()
      .sort_values(ascending=False)
)


# ---------------------------------------------------------------------------
# Вивід у консоль
# ---------------------------------------------------------------------------
print("=" * 70)
print("ЗАГАЛЬНА ХАРАКТЕРИСТИКА ДАТАСЕТУ")
print("=" * 70)
print(f"Загальна кількість рядків (спостережень):  {len(df):>8}")
print(f"1. Унікальних класів (common_name):        {n_classes:>8}")
print(f"2. Унікальних варіантів-синонімів усього:  {n_synonyms_total:>8}")
print(f"3. Середня к-сть синонімів на клас:        {avg_synonyms:>8.2f}")
print(f"   Медіана:                                {synonyms_per_class.median():>8.2f}")
print(f"4. Мінімум синонімів на клас:              {min_synonyms:>8}"
      f"   ({class_with_min})")
print(f"   Максимум синонімів на клас:             {max_synonyms:>8}"
      f"   ({class_with_max})")
print()

print("=" * 70)
print("5. РОЗПОДІЛ ЗА ТИПОМ БІОЛОГІЧНОГО МАТЕРІАЛУ (унікальних класів)")
print("=" * 70)
for fluid, count in classes_per_fluid.items():
    pct = count / n_classes * 100
    print(f"  {fluid:<30} {count:>5}  ({pct:5.1f}%)")
print()

print("=" * 70)
print("6. РОЗПОДІЛ ЗА КАТЕГОРІЄЮ ДОСЛІДЖЕННЯ (унікальних класів)")
print("=" * 70)
print(f"Всього категорій: {classes_per_category.shape[0]}")
print()
print("Топ-10:")
for cat, count in classes_per_category.head(10).items():
    pct = count / n_classes * 100
    print(f"  {cat:<40} {count:>5}  ({pct:5.1f}%)")
print()


# ===========================================================================
# ДІАГРАМА 1. Таблиця — загальна характеристика датасету
# ===========================================================================
fig, ax = plt.subplots(figsize=(10, 4))
ax.axis("off")

table_data = [
    ["Джерело даних",                  "MIMIC-IV + LOINC (стандартизовані назви UA)"],
    ["Загальна кількість рядків",      f"{len(df):,}"],
    ["Унікальних класів",              f"{n_classes:,}"],
    ["Унікальних варіантів (синонімів)", f"{n_synonyms_total:,}"],
    ["Сер. синонімів на клас",         f"{avg_synonyms:.2f}"],
    ["Мін / Макс синонімів на клас",   f"{min_synonyms} / {max_synonyms}"],
    ["Категорій досліджень",           f"{classes_per_category.shape[0]}"],
    ["Типів біоматеріалу",             f"{classes_per_fluid.shape[0]}"],
    ["Формування ground truth",        "Маппінг MIMIC-IV → LOINC, експертна перевірка"],
]

table = ax.table(
    cellText=table_data,
    colLabels=["Параметр", "Значення"],
    cellLoc="left",
    loc="center",
    colWidths=[0.45, 0.55],
)
table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1, 1.6)

# Стилізація заголовка
for i in range(2):
    cell = table[(0, i)]
    cell.set_facecolor("#4472C4")
    cell.set_text_props(color="white", weight="bold")

plt.title("Таблиця 1. Загальна характеристика датасету", pad=20, fontsize=13, weight="bold")
plt.savefig(OUTPUT_DIR / "1_summary_table.png", dpi=200, bbox_inches="tight")
plt.close()


# ===========================================================================
# ДІАГРАМА 2. Топ-10 категорій за кількістю класів
# ===========================================================================
top10_cats = classes_per_category.head(10)

fig, ax = plt.subplots(figsize=(11, 6))
bars = ax.barh(top10_cats.index[::-1], top10_cats.values[::-1], color="#4472C4")
ax.set_xlabel("Кількість унікальних класів")
ax.set_title("Топ-10 категорій досліджень за кількістю класів", fontsize=13, weight="bold")

# Підписи значень на стовпчиках
for bar in bars:
    width = bar.get_width()
    ax.text(width + max(top10_cats.values) * 0.01,
            bar.get_y() + bar.get_height() / 2,
            f"{int(width)}",
            va="center", fontsize=10)

ax.grid(axis="x", linestyle="--", alpha=0.5)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "2_top10_categories.png", dpi=200, bbox_inches="tight")
plt.close()


# ===========================================================================
# ДІАГРАМА 3. Гістограма — розподіл кількості синонімів на клас
# ===========================================================================
fig, ax = plt.subplots(figsize=(11, 6))

# Bin width = 1, щоб видно дискретний розподіл
max_val = synonyms_per_class.max()
bins = range(1, max_val + 2)

ax.hist(synonyms_per_class.values, bins=bins, color="#70AD47",
        edgecolor="black", alpha=0.85)

ax.axvline(avg_synonyms, color="red", linestyle="--", linewidth=2,
           label=f"Середнє = {avg_synonyms:.2f}")
ax.axvline(synonyms_per_class.median(), color="orange", linestyle="--", linewidth=2,
           label=f"Медіана = {synonyms_per_class.median():.1f}")

ax.set_xlabel("Кількість синонімів на клас")
ax.set_ylabel("Кількість класів")
ax.set_title("Розподіл кількості синонімів на клас (баланс датасету)",
             fontsize=13, weight="bold")
ax.legend()
ax.grid(axis="y", linestyle="--", alpha=0.5)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "3_synonyms_distribution.png", dpi=200, bbox_inches="tight")
plt.close()


# ===========================================================================
# ДІАГРАМА 4. Розподіл за типом біоматеріалу (кругова)
# ===========================================================================
fig, ax = plt.subplots(figsize=(9, 8))

# Якщо є дуже малі частки — групуємо в "Інше" для читабельності
threshold = 0.03 * classes_per_fluid.sum()
big   = classes_per_fluid[classes_per_fluid >= threshold]
small = classes_per_fluid[classes_per_fluid <  threshold]

if not small.empty:
    big = pd.concat([big, pd.Series({"Інше": small.sum()})])

colors = plt.cm.Set2.colors

wedges, texts, autotexts = ax.pie(
    big.values,
    labels=big.index,
    autopct=lambda p: f"{p:.1f}%\n({int(p * big.sum() / 100)})",
    colors=colors,
    startangle=90,
    textprops={"fontsize": 10},
)
for autotext in autotexts:
    autotext.set_color("white")
    autotext.set_weight("bold")

ax.set_title("Розподіл унікальних класів за типом біологічного матеріалу",
             fontsize=13, weight="bold", pad=20)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "4_fluid_distribution.png", dpi=200, bbox_inches="tight")
plt.close()


print("=" * 70)
print(f"✅ Готово. Діаграми збережено в: {OUTPUT_DIR.resolve()}")
print("   1_summary_table.png")
print("   2_top10_categories.png")
print("   3_synonyms_distribution.png")
print("   4_fluid_distribution.png")
print("=" * 70)