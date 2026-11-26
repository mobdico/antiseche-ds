"""
Scénarios de graphiques : chaque combinaison est tracée par le VRAI matplotlib / seaborn
(scripts/viz/generate.py) et enregistrée en image dans public/viz/.
"""

SETUP = '''
import numpy as np, pandas as pd, matplotlib.pyplot as plt, seaborn as sns
from matplotlib import style
rng = np.random.default_rng(42)
n = 60
date = pd.date_range("2024-03-01", periods=n, freq="D")
temp = np.round(10 + 12 * np.sin(np.linspace(0, 3, n)) + rng.normal(0, 2, n), 1)
humidite = np.clip(np.round(80 - temp * 1.5 + rng.normal(0, 8, n)), 20, 100)
vent = np.round(rng.uniform(5, 40, n), 1)
meteo = rng.choice(["soleil", "nuages", "pluie"], n, p=[0.5, 0.3, 0.2])
saison = np.array(["hiver"] * 20 + ["printemps"] * 20 + ["été"] * 20)
locations = np.round(200 + 25 * temp - 2 * humidite - 60 * (meteo == "pluie") + rng.normal(0, 40, n)).astype(int)
df = pd.DataFrame({"date": date, "temp": temp, "humidite": humidite, "vent": vent, "meteo": meteo, "saison": saison, "locations": locations})
'''
DATA_NOTE = "# df : 60 jours de locations de vélos (date, temp, humidite, vent, meteo, saison, locations)"


def P(id, options, default, label=None):
    return {"id": id, "label": label or id, "default": default, "options": [{"code": c, "help": h} for c, h in options]}


def S(id, title, code, params, doc):
    return {"id": id, "title": title, "code": code, "params": params, "doc": doc}


SCENARIOS = [
    # ---------------------------------------------------------------- Courbes et séries temporelles
    S("courbes", "Graphique en courbes", 'import matplotlib.dates as mdates\nplt.figure(figsize=(7, 3.5))\nplt.plot(df["date"], df["locations"]«label»)\nplt.gca().xaxis.set_major_formatter(mdates.DateFormatter("%d %b"))  # dates courtes, lisibles\n«decor»\nplt.show()',
      [P("label", [("", "sans label"), (', label="locations"', "avec un label (pour la légende)")], "", "label"),
       P("decor", [("", "aucun habillage"), ('plt.title("Locations de vélos par jour")\nplt.xlabel("Date")\nplt.ylabel("Locations")', "titre + labels d’axes"),
                   ('plt.plot(df["date"], df["temp"] * 20, label="temp × 20")\nplt.legend()', "2e courbe + légende"), ("plt.xticks(rotation=45)", "graduations inclinées")], "", "habillage")],
      "`plt.plot(x, y)` relie les points : le **temps sur l’axe des x**. Titre, labels et légende rendent le graphique lisible."),
    S("notation", "Retirer la notation scientifique", "annees = np.arange(2000, 2011)\npopulation = 6.1e9 + annees.astype(float) * 0 + (annees - 2000) * 7.5e7\nplt.figure(figsize=(6, 3.5))\nplt.plot(annees, population)\n«fmt»\nplt.show()",
      [P("fmt", [("", "par défaut : 1e9 en haut de l’axe"), ('plt.ticklabel_format(axis="y", style="plain")', "valeurs complètes")], "", "format de l’axe y")],
      "Pour de grands nombres, matplotlib affiche un facteur `1e9` ; `ticklabel_format(style=\"plain\")` l’enlève."),
    # ---------------------------------------------------------------- Nuages de points et corrélations
    S("scatter", "Nuage de points et corrélation", 'plt.figure(figsize=(5, 4))\nplt.scatter(df[«x»], df["locations"])\nplt.xlabel(«x»)\nplt.ylabel("locations")\nprint("r =", round(df[«x»].corr(df["locations"]), 2))\nplt.show()',
      [P("x", [('"temp"', "température"), ('"humidite"', "humidité"), ('"vent"', "vent")], '"temp"', "variable en x")],
      "`colonne1.corr(colonne2)` : coefficient de Pearson entre −1 et 1."),
    S("pearson", "Que vaut r ?", "x = rng.normal(0, 1, 200)\ny = «rel»\nplt.figure(figsize=(4.5, 4))\nplt.scatter(x, y, s=10)\nprint(\"r =\", round(np.corrcoef(x, y)[0, 1], 2))\nplt.show()",
      [P("rel", [("x + rng.normal(0, 0.3, 200)", "forte positive"), ("x + rng.normal(0, 1.5, 200)", "faible positive"), ("rng.normal(0, 1, 200)", "aucune"),
                 ("-x + rng.normal(0, 0.5, 200)", "forte négative"), ("x ** 2 + rng.normal(0, 0.3, 200)", "relation forte mais NON linéaire")], "x + rng.normal(0, 0.3, 200)", "relation")],
      "r mesure une relation **linéaire** : une parabole parfaite peut donner r ≈ 0."),
    # ---------------------------------------------------------------- Barres, histogrammes, distributions
    S("barres", "Diagramme en barres", 'moy = df.groupby("meteo")["locations"].mean()\nplt.figure(figsize=(5.5, 3.5))\n«plot»\nplt.title("Locations moyennes selon la météo")\nplt.show()',
      [P("plot", [("plt.bar(moy.index, moy)", "barres verticales"), ("plt.barh(moy.index, moy)", "barres horizontales"),
                  ("plt.bar(moy.index, moy)\nplt.xticks(rotation=45)", "verticales, graduations inclinées"), ('plt.bar(moy.index, moy)\nplt.xticks(ticks=[0, 1, 2], labels=["Nuageux", "Pluvieux", "Ensoleillé"])', "graduations renommées")],
         "plt.bar(moy.index, moy)", "tracé")],
      "`plt.bar(x, height)` / `plt.barh(y, width)` ; `plt.xticks(ticks=, labels=, rotation=)` personnalise les graduations."),
    S("histogramme", "Histogramme : bins et forme", "donnees = «d»\nplt.figure(figsize=(5.5, 3.5))\nplt.hist(donnees, bins=«b»)\nplt.xlabel(\"valeur\")\nplt.ylabel(\"effectif\")\nprint(pd.Series(donnees).value_counts(bins=5).sort_index())\nplt.show()",
      [P("d", [("rng.normal(50, 10, 500)", "distribution normale"), ("rng.exponential(10, 500)", "asymétrique (traîne à droite)"), ('df["locations"]', "les locations de vélos")], "rng.normal(50, 10, 500)", "données"),
       P("b", [("5", "5 intervalles"), ("10", "10 intervalles (défaut)"), ("40", "40 intervalles")], "10", "bins")],
      "Un histogramme regroupe les valeurs en **intervalles** (bins) ; trop peu cache la forme, trop en ajoute du bruit."),
    # ---------------------------------------------------------------- pandas et grilles
    S("pandas-plot", "Tracer directement avec pandas", '«plot»\nplt.show()',
      [P("plot", [('df["locations"].plot.hist(figsize=(5.5, 3.5))', "Series.plot.hist()"), ('df["meteo"].value_counts().plot.bar(figsize=(5.5, 3.5), rot=0)', "Series.plot.bar() (rot=0 : étiquettes horizontales)"),
                  ('df["meteo"].value_counts().plot.barh(figsize=(5.5, 3.5))', "Series.plot.barh()"), ('df.plot.line(x="date", y="locations", figsize=(6, 3.5))', "DataFrame.plot.line()"),
                  ('df.plot.scatter(x="temp", y="locations", figsize=(5, 4))', "DataFrame.plot.scatter()")], 'df["locations"].plot.hist(figsize=(5.5, 3.5))', "méthode")],
      "`serie.plot.hist()`, `.bar()`, `.barh()`, `.line()`, `df.plot.scatter(x=, y=)` : matplotlib sans `plt.hist()` ni `plt.bar()`."),
    S("subplot", "Grille de graphiques (small multiples)", 'plt.figure(figsize=«fs»)\nfor i, s in enumerate(["hiver", "printemps", "été"]):\n    plt.subplot(«grid», i + 1)\n    sous = df[df["saison"] == s]\n    plt.scatter(sous["temp"], sous["locations"], s=12)\n    plt.title(s)\n    «ech»\nplt.show()',
      [P("grid", [("1, 3", "1 ligne × 3 colonnes"), ("3, 1", "3 lignes × 1 colonne"), ("2, 2", "2 × 2 (une case vide)")], "1, 3", "nrows, ncols"),
       P("fs", [("(9, 3)", "large"), ("(5, 5)", "carré, plus serré")], "(9, 3)", "figsize"),
       P("ech", [("", "échelles indépendantes"), ("plt.xlim(-5, 30)\n    plt.ylim(0, 900)", "mêmes échelles : comparaison honnête")], "", "échelles")],
      "`plt.subplot(nrows, ncols, index)` : index de gauche à droite puis de haut en bas. Des **échelles communes** rendent la comparaison juste."),
    # ---------------------------------------------------------------- Seaborn
    S("seaborn", "sns.scatterplot : hue, size, style", 'sns.set_theme()\nplt.figure(figsize=(6, 4))\nax = sns.scatterplot(data=df, x="temp", y="locations"«hue»«size»«style»)\nif ax.get_legend():\n    sns.move_legend(ax, "upper left", bbox_to_anchor=(1, 1))\nplt.show()',
      [P("hue", [("", "pas de couleur"), (', hue="humidite", palette="RdYlGn"', "couleur = humidité"), (', hue="saison"', "couleur = saison")], "", "hue"),
       P("size", [("", "taille fixe"), (', size="vent", sizes=(10, 150)', "taille = vent")], "", "size"),
       P("style", [("", "même forme"), (', style="meteo"', "forme = météo")], "", "style")],
      "Seaborn encode une variable de plus par **couleur** (`hue`), **taille** (`size`, `sizes`) et **forme** (`style`)."),
    S("relplot", "sns.relplot : séparer en facettes", 'sns.set_theme()\nsns.relplot(data=df, x="temp", y="locations", hue="meteo"«col», height=3.6, aspect=1.1)\nplt.show()',
      [P("col", [("", "un seul graphique"), (', col="saison"', "une colonne par saison"), (', col="meteo"', "une colonne par météo")], ', col="saison"', "col")],
      "`sns.relplot(..., col=\"colonne\")` crée une **grille** de graphiques en une ligne."),
    # ---------------------------------------------------------------- Storytelling : audience et data-ink
    S("data-ink", "Maximiser le ratio d’encre-donnée", 'moy = df.groupby("meteo")["locations"].mean().sort_values()\nfig, ax = plt.subplots(figsize=(5.5, 3))\nax.barh(moy.index, moy, height=«h»)\n«spines»\n«ticks»\n«text»\nplt.show()',
      [P("h", [("0.8", "barres épaisses (défaut)"), ("0.45", "barres plus fines")], "0.8", "height"),
       P("spines", [("", "bordures conservées"), ('for cote in ["top", "right", "left", "bottom"]:\n    ax.spines[cote].set_visible(False)', "bordures (spines) retirées")], "", "bordures"),
       P("ticks", [("", "graduations conservées"), ("ax.tick_params(bottom=False, left=False)", "graduations retirées")], "", "graduations"),
       P("text", [("", "pas de valeurs"), ('for i, v in enumerate(moy):\n    ax.text(v + 5, i, round(v), va="center", size=9)\nax.set_xticks([])', "valeurs écrites sur les barres, axe x retiré")], "", "étiquettes")],
      "Effacer l’encre **non-donnée** (bordures, graduations) et l’encre redondante : le message ressort."),
    # ---------------------------------------------------------------- Raconter un changement
    S("subplots-story", "Grille de graphiques : raconter un changement",
      'import matplotlib.dates as mdates\nfig, axes = plt.subplots(nrows=4, ncols=1, figsize=(7, 6.5), sharex=True)\ncols = ["temp", "humidite", "vent", "locations"]\nnoms = ["Température (°C)", "Humidité (%)", "Vent (km/h)", "Locations de vélos"]\nfor ax, col, nom in zip(axes, cols, noms):\n    ax.plot(df["date"], df[col], color="«c»", linewidth=1.6)\n    ax.text(0, 1.04, nom, transform=ax.transAxes, fontsize=10, fontweight="bold", color="#333333")\n    for cote in ["top", "right"]:\n        ax.spines[cote].set_visible(False)\n    ax.yaxis.set_major_locator(plt.MaxNLocator(3))\naxes[-1].xaxis.set_major_formatter(mdates.DateFormatter("%d %b"))\n«cible»\nplt.tight_layout()\nplt.show()',
      [P("c", [("#9a9a9a", "toutes en gris : rien ne ressort encore"), ("#1f77b4", "toutes en bleu")], "#9a9a9a", "couleur de base"),
       P("cible", [("", "aucune mise en avant"),
                   ('jour = df["locations"].idxmax()\naxes[3].plot(df["date"], df["locations"], color="#d62728", linewidth=2.2)\naxes[3].annotate(f"record : {df[\'locations\'][jour]} locations", xy=(df["date"][jour], df["locations"][jour]), xytext=(-150, -8), textcoords="offset points", color="#d62728", fontsize=9, fontweight="bold", arrowprops=dict(arrowstyle="->", color="#d62728"))',
                    "axes[3] en rouge + annotation du record"),
                   ('axes[0].axhline(y=df["temp"].max() + 1, xmin=0.55, xmax=0.85, linewidth=6, color="#d62728")\naxes[0].text(0.86, 1.04, "◄ période la plus chaude", transform=axes[0].transAxes, color="#d62728", fontsize=9, fontweight="bold", ha="left")',
                    "barre axhline (xmin / xmax) légendée")], "", "mise en avant")],
      "`plt.subplots(nrows, ncols)` renvoie un tableau d’Axes : une boucle `for ax in axes` habille tous les graphiques, `axes[3]` en cible un seul. Tout en gris, l’essentiel en couleur."),
    S("style", "Styles matplotlib", 'style.use(«st»)\nmoy = df.groupby("meteo")["locations"].mean()\nfig, ax = plt.subplots(figsize=(5.5, 3.2))\nax.barh(moy.index, moy, color=«col»)\n«grid»\nplt.show()',
      [P("st", [('"default"', "style par défaut"), ('"fivethirtyeight"', "FiveThirtyEight"), ('"ggplot"', "ggplot"), ('"seaborn-v0_8"', "seaborn")], '"fivethirtyeight"', "style"),
       P("col", [("None", "couleur du style"), ('(moy > moy.mean()).map({True: "#33A1C9", False: "#ffae42"})', "couleur selon une condition")], "None", "color"),
       P("grid", [("", "grille du style"), ("ax.grid(False)", "grille supprimée")], "", "grille")],
      "`style.use()` change l’apparence globale (avant de tracer) ; `color=` accepte une couleur **par barre**."),
]
