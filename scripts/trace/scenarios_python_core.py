"""
Scénarios tracés des fiches Python Core. Chaque scénario = un code avec des emplacements «param»,
et pour chaque paramètre la liste des extraits de code à essayer (avec une aide en français).
Toutes les combinaisons sont exécutées par le vrai Python (scripts/trace/trace.py).
"""


def P(id, options, default, label=None):
    return {"id": id, "label": label or id, "default": default, "options": [{"code": c, "help": h} for c, h in options]}


def S(id, title, code, params, doc):
    return {"id": id, "title": title, "code": code, "params": params, "doc": doc}


SCENARIOS = [
    # ---------------------------------------------------------------- Programmer en Python
    S("ordre-operations", "Ordre des opérations", "resultat = «expr»\nprint(resultat)",
      [P("expr", [("2 + 3 * 4", "la multiplication passe avant l’addition"), ("(2 + 3) * 4", "les parenthèses passent en premier"),
                  ("2 * 3 ** 2", "l’exponentiation passe avant la multiplication"), ("(2 * 3) ** 2", "parenthèses d’abord"),
                  ("10 / 4", "`/` donne toujours un float"), ("10 // 4", "`//` : division entière"), ("10 % 4", "`%` : reste de la division"),
                  ("-2 ** 2", "`**` passe avant le signe moins : −(2²)"), ("2 ** 3 ** 2", "`**` se lit de droite à gauche : 2^(3²)")], "2 + 3 * 4", "expression")],
      "Python applique les priorités : parenthèses, `**`, puis `*` `/` `//` `%`, puis `+` `-`."),
    S("une-instruction", "Une instruction par ligne", "«code»",
      [P("code", [("print(5 * 3)\nprint(5 ** 3)", "deux instructions, deux lignes"), ("print(5 * 3) print(5 ** 3)", "deux instructions sur une seule ligne"),
                  ("# print(5 * 3)\nprint(5 ** 3)", "la 1re ligne est un commentaire : ignorée"), ("print(5 * 3)  # commentaire en fin de ligne", "commentaire après le code")],
         "print(5 * 3)\nprint(5 ** 3)", "code")],
      "Une instruction par ligne ; tout ce qui suit `#` est ignoré."),
    # ---------------------------------------------------------------- Les variables
    S("raccourcis", "Mettre à jour une variable", "total = 100\ntotal «op» 10\nprint(total)",
      [P("op", [("+=", "total = total + 10"), ("-=", "total = total − 10"), ("*=", "total = total × 10"), ("/=", "total = total / 10 → devient un float"),
                ("//=", "division entière"), ("**=", "puissance"), ("= total +", "forme longue, équivalente à +=")], "+=", "opérateur")],
      "Les raccourcis `+=`, `-=`, `*=`, `/=`… réaffectent la variable avec le résultat. Un `int` est immuable : `total` pointe vers un **nouvel objet**."),
    S("nommage", "Règles de nommage", "«nom» = 6.99\nprint(«nom»)",
      [P("nom", [("prix_total", "snake_case : la convention Python"), ("PrixTotal", "autorisé, mais réservé aux classes par convention"), ("_prix", "autorisé (commence par _)"),
                 ("prix2", "chiffre autorisé après la 1re lettre"), ("2prix", "interdit : commence par un chiffre"), ("prix-total", "interdit : le tiret est une soustraction"),
                 ("prix total", "interdit : pas d’espace"), ("class", "interdit : mot réservé de Python")], "prix_total", "nom")],
      "Lettres, chiffres et `_` uniquement, sans commencer par un chiffre ; pas de mot réservé."),
    S("nameerror", "NameError : variable non définie", "prix = 6.99\nprint(«nom»)",
      [P("nom", [("prix", "nom correct"), ("Prix", "Python distingue majuscules et minuscules"), ("prx", "faute de frappe"), ("total", "jamais créée")], "prix", "variable affichée")],
      "Une `NameError` survient à l’**exécution** quand on utilise un nom jamais défini."),
    S("references", "Deux noms, un objet ?", "a = «v»\nb = a\na «op» «x»\nprint(a, b)",
      [P("v", [("5", "un entier (immuable)"), ("[5]", "une liste (mutable)")], "5", "valeur de a"),
       P("op", [("+=", "raccourci"), ("= a +", "forme longue")], "+=", "opération"),
       P("x", [("1", "ajouter 1"), ("[1]", "ajouter la liste [1]")], "1", "opérande")],
      "`b = a` ne copie rien : les deux noms pointent vers **le même objet**. Seul `+=` sur une liste le modifie sur place."),
    # ---------------------------------------------------------------- Les types de données
    S("conversions", "type() et conversions", "x = «v»\ny = «f»(x)\nprint(type(x), type(y), y)",
      [P("v", [("42", "int"), ("3.7", "float"), ("-3.7", "float négatif"), ('"42"', "texte qui ressemble à un entier"), ('"3.7"', "texte qui ressemble à un décimal"), ("True", "bool")], "3.7", "valeur"),
       P("f", [("int", "tronque (coupe) la partie décimale"), ("float", "convertit en décimal"), ("round", "arrondit au plus proche"), ("str", "convertit en texte"), ("bool", "0, 0.0 et \"\" → False, le reste → True")], "int", "fonction")],
      "`int()` **tronque**, `round()` **arrondit**, `str()` produit du texte. Une chaîne non numérique ne se convertit pas."),
    S("concatenation", "Concaténer du texte", "prix = 9.99\nmessage = «expr»\nprint(message)",
      [P("expr", [('"Prix : " + prix', "texte + nombre"), ('"Prix : " + str(prix)', "convertir d’abord avec str()"), ('f"Prix : {prix}"', "f-string : la solution moderne"),
                  ('"Prix : " + str(prix) + " €"', "plusieurs morceaux"), ('"ha" * 3', "`*` répète une chaîne"), ('"5" + "5"', "deux chaînes : concaténation, pas addition")],
         '"Prix : " + prix', "expression")],
      "`+` concatène des **chaînes** ; pour un nombre, convertir avec `str()` ou utiliser une f-string."),
    S("chaines", "Guillemets, échappement, multi-lignes", "texte = «s»\nprint(texte)\nprint(len(texte))",
      [P("s", [("'L\\'été'", "apostrophe échappée avec \\\\"), ('"L\'été"', "apostrophe dans des guillemets doubles : rien à échapper"), ("'L'été'", "apostrophe non échappée"),
               ('"Il a dit \\"oui\\""', "guillemets échappés"), ("'''ligne 1\nligne 2'''", "triples guillemets : plusieurs lignes"), ('"ligne 1\\nligne 2"', "\\\\n : retour à la ligne")],
         "'L\\'été'", "chaîne")],
      "`\\` échappe un guillemet ; les triples guillemets permettent plusieurs lignes et tous les guillemets."),
    # ---------------------------------------------------------------- Les listes
    S("indexation", "Indexation et slicing", 'lettres = ["a", "b", "c", "d", "e"]\nres = «expr»\nprint(res)',
      [P("expr", [("lettres[0]", "1er élément (index 0)"), ("lettres[-1]", "dernier élément"), ("lettres[-2]", "avant-dernier"), ("lettres[1:3]", "de 1 inclus à 3 exclu"),
                  ("lettres[:2]", "les 2 premiers"), ("lettres[3:]", "à partir de l’index 3"), ("lettres[::2]", "un sur deux"), ("lettres[::-1]", "à l’envers"),
                  ("lettres[1:100]", "une borne trop grande ne provoque pas d’erreur en slicing"), ("lettres[5]", "index hors limites")], "lettres[1:3]", "expression")],
      "`liste[m:n]` : de m **inclus** à n **exclu** ; un index négatif part de la fin. Le slicing renvoie une **nouvelle liste**."),
    S("liste-de-listes", "Liste de listes", 'donnees = [["Ana", 12, 15], ["Bob", 8, 11], ["Chloé", 17, 13]]\nres = «expr»\nprint(res)',
      [P("expr", [("donnees[0]", "la 1re ligne (une liste)"), ("donnees[0][-1]", "dernière valeur de la 1re ligne"), ("donnees[-1][0]", "1re valeur de la dernière ligne"),
                  ("donnees[1][1:]", "slicing dans une ligne"), ("len(donnees)", "nombre de lignes"), ("len(donnees[0])", "nombre de colonnes")], "donnees[0][-1]", "expression")],
      "1er indice = la ligne, 2e indice = la valeur dans la ligne."),
    # ---------------------------------------------------------------- Les boucles for
    S("accumuler", "Accumuler dans une boucle", "notes = [12, 15, 9]\n«init»\nfor note in notes:\n«body»\nprint(somme / len(notes))",
      [P("init", [("somme = 0", "initialisée une fois, avant la boucle"), ("", "pas d’initialisation")], "somme = 0", "avant la boucle"),
       P("body", [("    somme = somme + note", "ajouter la note"), ("    somme += note", "raccourci équivalent"), ("    somme = 0\n    somme = somme + note", "réinitialisée À CHAQUE tour (bug)"), ("somme = somme + note", "corps non indenté")],
         "    somme = somme + note", "corps de la boucle")],
      "L’accumulateur s’initialise **avant** la boucle ; le corps (indenté de 4 espaces) s’exécute une fois par élément."),
    S("convertir-csv", "Les données CSV sont du texte", 'lignes = [["Ana", "12.5"], ["Bob", "15"], ["Chloé", "9"]]\nnotes = []\nfor ligne in lignes:\n    notes.append(«conv»)\nprint(notes)\nprint(sum(notes) / len(notes))',
      [P("conv", [("ligne[1]", "sans conversion : du texte"), ("float(ligne[1])", "converti en décimal"), ("int(ligne[1])", "converti en entier")], "ligne[1]", "valeur ajoutée")],
      "Ce qu’on lit dans un CSV est toujours une chaîne : convertir avec `float()` ou `int()` avant de calculer."),
    # ---------------------------------------------------------------- Les conditions avec if
    S("filtrer", "Filtrer avec if dans une boucle", "prix = [0.0, 2.99, 0.0, 4.99]\nnotes = [4.5, 3.9, 4.1, 4.8]\ngratuites = []\nfor i in range(len(prix)):\n    if «cond»:\n«body»\nprint(gratuites)",
      [P("cond", [("prix[i] == 0.0", "égal à 0.0"), ("prix[i] != 0.0", "différent de 0.0"), ("prix[i] == 0", "0 (int) == 0.0 (float) vaut True"), ("prix[i] = 0.0", "un seul = : affectation, pas comparaison")],
         "prix[i] == 0.0", "condition"),
       P("body", [("        gratuites.append(notes[i])", "indenté sous le if"), ("    gratuites.append(notes[i])", "pas indenté sous le if")], "        gratuites.append(notes[i])", "corps du if")],
      "`if condition:` exécute le bloc indenté seulement si la condition vaut True. `==` compare, `=` affecte."),
    # ---------------------------------------------------------------- Les conditions multiples
    S("and-or", "and, or et parenthèses", 'apps = [["A", 0, "Games"], ["B", 2, "Games"], ["C", 0, "Social"], ["D", 3, "Social"], ["E", 0, "Music"]]\ngardees = []\nfor nom, prix, genre in apps:\n    if «cond»:\n        gardees.append(nom)\nprint(gardees)',
      [P("cond", [('prix == 0 and genre == "Games"', "gratuite ET jeu"), ('genre == "Games" or genre == "Social"', "jeu OU réseau social"),
                  ('prix == 0 and genre == "Games" or genre == "Social"', "sans parenthèses : and est évalué avant or"),
                  ('prix == 0 and (genre == "Games" or genre == "Social")', "avec parenthèses : la logique voulue"), ('not prix == 0', "payante"), ('prix > 0 or genre == "Music"', "payante OU musique")],
         'prix == 0 and genre == "Games"', "condition")],
      "`and` : tout doit être vrai ; `or` : au moins un. Sans parenthèses, `and` passe avant `or` → **erreur logique** silencieuse."),
    S("elif", "if / elif / else : l’ordre compte", 'for prix in [0, 5, 15, 30]:\n«chaine»\n    print(prix, categorie)',
      [P("chaine", [('    if prix == 0:\n        categorie = "gratuit"\n    elif prix < 10:\n        categorie = "abordable"\n    elif prix < 20:\n        categorie = "cher"\n    else:\n        categorie = "très cher"', "du plus restrictif au plus large"),
                    ('    if prix < 20:\n        categorie = "cher"\n    elif prix < 10:\n        categorie = "abordable"\n    elif prix == 0:\n        categorie = "gratuit"\n    else:\n        categorie = "très cher"', "ordre inversé : la 1re condition vraie gagne"),
                    ('    if prix == 0:\n        categorie = "gratuit"\n    if prix < 10:\n        categorie = "abordable"\n    else:\n        categorie = "très cher"', "deux if au lieu de if/elif : le 2e écrase le 1er")],
         '    if prix == 0:\n        categorie = "gratuit"\n    elif prix < 10:\n        categorie = "abordable"\n    elif prix < 20:\n        categorie = "cher"\n    else:\n        categorie = "très cher"', "structure")],
      "Dans un `if/elif/else`, **seul le premier bloc vrai** s’exécute : les conditions suivantes sont ignorées."),
    # ---------------------------------------------------------------- Les dictionnaires
    S("dico", "Créer, lire, modifier un dictionnaire", 'notes = {"Games": 4.5, "Music": 3.9}\n«op»\nprint(notes)',
      [P("op", [('x = notes["Games"]', "lire une valeur par sa clé"), ('x = notes["games"]', "clé inexistante (casse différente)"), ('notes["Social"] = 4.1', "ajouter une paire"),
                ('notes["Games"] = 5.0', "modifier une valeur existante"), ('x = notes.get("Social", 0)', "lire avec une valeur par défaut, sans erreur"), ('x = notes[0]', "pas d’index numérique dans un dict")],
         'x = notes["Games"]', "opération")],
      "On accède par **clé** (`d[clé]`), pas par position. Une clé absente → `KeyError` ; `get()` l’évite."),
    S("cles", "Quelles clés sont valides ?", "d = «d»\nprint(d)\nprint(len(d))",
      [P("d", [('{"a": 1, "b": 2}', "clés str : classique"), ("{1: 'x', 2.5: 'y', True: 'z'}", "int, float, bool : valides"), ('{"a": 1, "a": 2}', "clé répétée"),
               ("{1: 'un', True: 'vrai'}", "True vaut 1 : même clé !"), ("{0: 'zéro', False: 'faux'}", "False vaut 0 : même clé"), ("{[1, 2]: 'liste'}", "une liste n’est pas hashable"), ("{(1, 2): 'tuple'}", "un tuple l’est")],
         '{"a": 1, "b": 2}', "dictionnaire")],
      "Clés uniques et **hashables** (str, int, float, bool, tuple). Clé répétée : la 1re clé est gardée avec la **dernière** valeur."),
    # ---------------------------------------------------------------- Tables de fréquences
    S("compter", "Construire une table de fréquences", 'genres = ["Games", "Music", "Games", "Social", "Games"]\nfreq = {}\nfor g in genres:\n«body»\nprint(freq)',
      [P("body", [("    if g in freq:\n        freq[g] += 1\n    else:\n        freq[g] = 1", "if/else : incrémenter ou initialiser"),
                  ("    freq[g] = freq.get(g, 0) + 1", "get() : la version compacte"), ("    freq[g] += 1", "sans initialisation")],
         "    if g in freq:\n        freq[g] += 1\n    else:\n        freq[g] = 1", "corps de la boucle")],
      "Clé déjà vue → `+= 1` ; nouvelle clé → `= 1`. `dico.get(clé, 0) + 1` fait les deux en une ligne."),
    S("in-dico", "in teste les clés, pas les valeurs", 'freq = {"Games": 3, "Music": 1}\nprint(«expr»)',
      [P("expr", [('"Games" in freq', "une clé"), ('3 in freq', "3 est une valeur, pas une clé"), ('3 in freq.values()', "chercher dans les valeurs"), ('"games" in freq', "sensible à la casse")],
         '"Games" in freq', "expression")],
      "`x in dico` cherche parmi les **clés**. Pour les valeurs : `x in dico.values()`."),
    S("proportions", "Fréquence, proportion, pourcentage", 'freq = {"Games": 3, "Music": 1, "Social": 1}\ntotal = «total»\nfor genre in freq:\n    pct = freq[genre] / total * 100\n    print(genre, round(pct, 1), "%")',
      [P("total", [("sum(freq.values())", "somme des fréquences"), ("len(freq)", "nombre de genres (erreur logique)")], "sum(freq.values())", "total")],
      "proportion = fréquence / total ; pourcentage = proportion × 100. `for k in dico` parcourt les **clés**."),
]
