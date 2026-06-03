"""
Візуалізація метрик класифікатора.

Читає:
  - ../output/evaluation_results.json — загальні метрики
  - ../output/evaluation_errors.json — список помилок
  - ../output/metrics_report.json — per-class метрики (з metrics.js)
  - ../output/test.csv — тестова вибірка

Генерує PNG-файли в папку charts/.
"""

import json
import csv
import os
from pathlib import Path
from collections import Counter, defaultdict

import matplotlib.pyplot as plt
import matplotlib
import numpy as np

# ─── Налаштування ────────────────────────────────────────────────

matplotlib.rcParams['font.family'] = 'DejaVu Sans'
matplotlib.rcParams['axes.unicode_minus'] = False

OUTPUT_DIR = Path(__file__).parent.parent / 'output'
CHARTS_DIR = Path(__file__).parent / 'charts'
CHARTS_DIR.mkdir(exist_ok=True)

# ─── Завантаження даних ──────────────────────────────────────────

def load_json(name):
    path = OUTPUT_DIR / name
    if not path.exists():
        raise FileNotFoundError(f'Файл не знайдено: {path}')
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_test_csv():
    path = OUTPUT_DIR / 'test.csv'
    records = []
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
    return records


def truncate(s, max_len=40):
    if len(s) <= max_len:
        return s
    return s[:max_len - 3] + '...'


# ─── 1. Розподіл F1 по класах (гістограма) ───────────────────────

def chart_f1_distribution(metrics):
    per_class = metrics['per_class']
    f1_scores = [c['f1'] for c in per_class if c['support'] > 0]

    fig, ax = plt.subplots(figsize=(10, 6))
    bins = np.linspace(0, 1, 21)
    n, _, patches = ax.hist(f1_scores, bins=bins, edgecolor='black', alpha=0.8)

    # Розфарбовуємо: червоний для низьких F1, зелений для високих
    for i, p in enumerate(patches):
        center = (bins[i] + bins[i + 1]) / 2
        if center < 0.5:
            p.set_facecolor('#d9534f')
        elif center < 0.8:
            p.set_facecolor('#f0ad4e')
        else:
            p.set_facecolor('#5cb85c')

    ax.set_xlabel('F1 Score', fontsize=12)
    ax.set_ylabel('Кількість класів', fontsize=12)
    ax.set_title(f'Розподіл F1 score по {len(f1_scores)} класах', fontsize=14, fontweight='bold')
    ax.grid(axis='y', alpha=0.3)

    # Додаємо текст з summary
    high = sum(1 for f in f1_scores if f >= 0.8)
    mid = sum(1 for f in f1_scores if 0.5 <= f < 0.8)
    low = sum(1 for f in f1_scores if f < 0.5)
    summary = f'F1 ≥ 0.8: {high} класів ({high/len(f1_scores)*100:.1f}%)\n' \
              f'0.5 ≤ F1 < 0.8: {mid} класів ({mid/len(f1_scores)*100:.1f}%)\n' \
              f'F1 < 0.5: {low} класів ({low/len(f1_scores)*100:.1f}%)'
    ax.text(0.02, 0.98, summary, transform=ax.transAxes,
            verticalalignment='top', fontsize=10,
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))

    plt.tight_layout()
    out = CHARTS_DIR / '01_f1_distribution.png'
    plt.savefig(out, dpi=150, bbox_inches='tight')
    plt.close()
    print(f'  ✓ {out.name}')


# ─── 2. Розподіл support по класах ────────────────────────────────

def chart_support_distribution(metrics):
    per_class = metrics['per_class']
    supports = sorted([c['support'] for c in per_class if c['support'] > 0], reverse=True)
    supports_weighted = sorted([c['support_weighted'] for c in per_class if c['support_weighted'] > 0], reverse=True)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Незважений support (кількість унікальних комбінацій)
    axes[0].bar(range(len(supports)), supports, color='#5bc0de', edgecolor='black', alpha=0.8)
    axes[0].set_xlabel('Клас (відсортовано за support)', fontsize=11)
    axes[0].set_ylabel('Кількість унікальних комбінацій', fontsize=11)
    axes[0].set_title('Розподіл support (унікальні комбінації)', fontsize=12, fontweight='bold')
    axes[0].grid(axis='y', alpha=0.3)
    axes[0].set_yscale('log')

    # Зважений support (реальна частота)
    axes[1].bar(range(len(supports_weighted)), supports_weighted, color='#f0ad4e', edgecolor='black', alpha=0.8)
    axes[1].set_xlabel('Клас (відсортовано за support)', fontsize=11)
    axes[1].set_ylabel('Реальна частота в test.csv', fontsize=11)
    axes[1].set_title('Розподіл support (зважений на частоту)', fontsize=12, fontweight='bold')
    axes[1].grid(axis='y', alpha=0.3)
    axes[1].set_yscale('log')

    plt.tight_layout()
    out = CHARTS_DIR / '02_support_distribution.png'
    plt.savefig(out, dpi=150, bbox_inches='tight')
    plt.close()
    print(f'  ✓ {out.name}')


# ─── 3. F1 vs Support (scatter) ───────────────────────────────────

def chart_f1_vs_support(metrics):
    per_class = metrics['per_class']
    data = [(c['support'], c['f1']) for c in per_class if c['support'] > 0]
    supports = [d[0] for d in data]
    f1s = [d[1] for d in data]

    fig, ax = plt.subplots(figsize=(10, 6))

    colors = ['#5cb85c' if f >= 0.8 else '#f0ad4e' if f >= 0.5 else '#d9534f' for f in f1s]
    ax.scatter(supports, f1s, c=colors, alpha=0.6, edgecolor='black', s=50)

    ax.set_xscale('log')
    ax.set_xlabel('Support (кількість унікальних комбінацій у тесті)', fontsize=12)
    ax.set_ylabel('F1 Score', fontsize=12)
    ax.set_title('Залежність F1 від кількості прикладів класу', fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3)
    ax.set_ylim(-0.05, 1.05)

    # Лінії порогів
    ax.axhline(y=0.8, color='#5cb85c', linestyle='--', alpha=0.5, label='F1 = 0.8')
    ax.axhline(y=0.5, color='#f0ad4e', linestyle='--', alpha=0.5, label='F1 = 0.5')
    ax.legend(loc='lower right')

    plt.tight_layout()
    out = CHARTS_DIR / '03_f1_vs_support.png'
    plt.savefig(out, dpi=150, bbox_inches='tight')
    plt.close()
    print(f'  ✓ {out.name}')


# ─── 4. Confusion Matrix для топ-20 класів ───────────────────────

def chart_confusion_matrix(metrics, errors, test_records):
    per_class = metrics['per_class']

    # Беремо топ-20 класів за support
    top_classes = sorted(per_class, key=lambda c: c['support_weighted'], reverse=True)[:20]
    top_class_names = [c['common_name'] for c in top_classes]
    name_to_idx = {name: i for i, name in enumerate(top_class_names)}

    # Будуємо confusion matrix
    n = len(top_class_names)
    matrix = np.zeros((n, n), dtype=int)

    # Збираємо унікальні комбінації з помилками
    error_keys = {}
    for err in errors:
        key = (
            (err.get('unofficial_name') or '').strip().lower(),
            (err.get('category') or '').strip().lower(),
            (err.get('fluid') or '').strip().lower(),
            (err.get('unit') or '').strip().lower(),
        )
        error_keys[key] = err

    # Дедуплікація test.csv
    unique_test = {}
    for r in test_records:
        key = (
            (r.get('unofficial_name') or '').strip().lower(),
            (r.get('category') or '').strip().lower(),
            (r.get('fluid') or '').strip().lower(),
            (r.get('unit') or '').strip().lower(),
        )
        if key not in unique_test:
            unique_test[key] = {'record': r, 'count': 0}
        unique_test[key]['count'] += 1

    # Заповнюємо матрицю
    for key, val in unique_test.items():
        expected = val['record']['common_name']
        if expected not in name_to_idx:
            continue
        i = name_to_idx[expected]

        if key in error_keys:
            predicted = error_keys[key]['predicted']
            if predicted in name_to_idx:
                j = name_to_idx[predicted]
                matrix[i, j] += val['count']
            # якщо predicted не в топ-20, то цю помилку не показуємо
        else:
            # Правильна класифікація
            matrix[i, i] += val['count']

    # Малюємо
    fig, ax = plt.subplots(figsize=(14, 12))

    # Логарифмічна шкала для кращої видимості
    matrix_log = np.log1p(matrix)
    im = ax.imshow(matrix_log, cmap='Blues', aspect='auto')

    # Підписи осей
    short_names = [truncate(n, 35) for n in top_class_names]
    ax.set_xticks(np.arange(n))
    ax.set_yticks(np.arange(n))
    ax.set_xticklabels(short_names, rotation=45, ha='right', fontsize=8)
    ax.set_yticklabels(short_names, fontsize=8)

    ax.set_xlabel('Передбачений клас', fontsize=12)
    ax.set_ylabel('Правильний клас', fontsize=12)
    ax.set_title(f'Confusion Matrix (топ-{n} найчастіших класів, log scale)',
                 fontsize=14, fontweight='bold')

    # Підписи в комірках
    for i in range(n):
        for j in range(n):
            if matrix[i, j] > 0:
                color = 'white' if matrix_log[i, j] > matrix_log.max() / 2 else 'black'
                ax.text(j, i, str(matrix[i, j]), ha='center', va='center',
                       color=color, fontsize=7)

    plt.tight_layout()
    out = CHARTS_DIR / '04_confusion_matrix.png'
    plt.savefig(out, dpi=150, bbox_inches='tight')
    plt.close()
    print(f'  ✓ {out.name}')


# ─── 5. Топ-15 найгірших класів за F1 ─────────────────────────────

def chart_worst_classes(metrics):
    per_class = metrics['per_class']
    # Тільки класи що були в тесті та support >= 2
    candidates = [c for c in per_class if c['support'] >= 2]
    worst = sorted(candidates, key=lambda c: c['f1'])[:15]

    names = [truncate(c['common_name'], 50) for c in worst]
    f1s = [c['f1'] for c in worst]
    supports = [c['support'] for c in worst]

    fig, ax = plt.subplots(figsize=(12, 8))
    y_pos = np.arange(len(names))

    bars = ax.barh(y_pos, f1s, color=['#d9534f' if f < 0.5 else '#f0ad4e' for f in f1s],
                   edgecolor='black', alpha=0.8)

    # Додаємо support до підписів
    labels = [f'{n}  (n={s})' for n, s in zip(names, supports)]
    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=9)
    ax.invert_yaxis()

    ax.set_xlabel('F1 Score', fontsize=12)
    ax.set_title('Топ-15 найгірших класів за F1 (support ≥ 2)',
                 fontsize=14, fontweight='bold')
    ax.set_xlim(0, 1)
    ax.grid(axis='x', alpha=0.3)

    # Значення F1 на барах
    for bar, f1 in zip(bars, f1s):
        ax.text(bar.get_width() + 0.01, bar.get_y() + bar.get_height() / 2,
               f'{f1:.2f}', va='center', fontsize=9)

    plt.tight_layout()
    out = CHARTS_DIR / '05_worst_classes.png'
    plt.savefig(out, dpi=150, bbox_inches='tight')
    plt.close()
    print(f'  ✓ {out.name}')


# ─── 6. Зведена діаграма всіх ключових метрик ────────────────────

def chart_summary(metrics, report):
    fig, ax = plt.subplots(figsize=(10, 6))

    categories = ['Top-1\n(weighted)', 'Top-3\n(weighted)', 'Top-5\n(weighted)',
                  'Top-1\n(unweighted)', 'Top-3\n(unweighted)', 'Top-5\n(unweighted)']

    wm = report['metrics_weighted']['top1']
    um = report['metrics_unweighted']['top1']

    values = [
        wm['top1_accuracy'] * 100,
        wm['top3_accuracy'] * 100,
        wm['top5_accuracy'] * 100,
        um['top1_accuracy'] * 100,
        um['top3_accuracy'] * 100,
        um['top5_accuracy'] * 100,
    ]

    colors = ['#5cb85c', '#5cb85c', '#5cb85c', '#5bc0de', '#5bc0de', '#5bc0de']
    bars = ax.bar(categories, values, color=colors, edgecolor='black', alpha=0.85)

    ax.set_ylabel('Accuracy (%)', fontsize=12)
    ax.set_ylim(0, 105)
    ax.set_title('Зведені метрики класифікатора', fontsize=14, fontweight='bold')
    ax.grid(axis='y', alpha=0.3)

    for bar, v in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1,
               f'{v:.2f}%', ha='center', fontsize=10, fontweight='bold')

    # Додатковий текст з F1
    macro_f1 = metrics['macro_f1']['unweighted']['f1']
    micro_f1 = metrics['micro_f1']['unweighted']['f1']
    info = f'Micro F1: {micro_f1*100:.2f}%\nMacro F1: {macro_f1*100:.2f}%'
    ax.text(0.98, 0.02, info, transform=ax.transAxes,
            horizontalalignment='right', fontsize=11,
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))

    plt.tight_layout()
    out = CHARTS_DIR / '06_summary.png'
    plt.savefig(out, dpi=150, bbox_inches='tight')
    plt.close()
    print(f'  ✓ {out.name}')


# ─── Запуск ──────────────────────────────────────────────────────

def main():
    print('=== Генерація діаграм ===\n')

    print('Завантаження даних...')
    report = load_json('evaluation_results.json')
    errors = load_json('evaluation_errors.json')
    metrics = load_json('metrics_report.json')
    test_records = load_test_csv()
    print(f'  Класів у metrics: {len(metrics["per_class"])}')
    print(f'  Помилок: {len(errors)}')
    print(f'  Рядків test.csv: {len(test_records)}\n')

    print('Генерація діаграм:')
    chart_f1_distribution(metrics)
    chart_support_distribution(metrics)
    chart_f1_vs_support(metrics)
    chart_confusion_matrix(metrics, errors, test_records)
    chart_worst_classes(metrics)
    chart_summary(metrics, report)

    print(f'\nГотово. PNG-файли у: {CHARTS_DIR}')


if __name__ == '__main__':
    main()