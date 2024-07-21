

## Avetissement

Il s'agit du scénario du déroulé d'une session de vote.
Il ne s'agit en aucun cas


## Intitulé

Test de vote de trois propositions, visant à réaliser des trades, liées à un Oracle ou un timing, avec quatre votants


## Contexte

La DAO (Decentralized Autonomous Organization) permet aux membres de voter sur diverses propositions. Les votes peuvent être clôturés soit après une certaine durée, soit lorsqu'un seuil défini par une donnée récupérée via un oracle est atteint.
- Il n'y a pas de limitation (*) quant au nombre de votants.
- Il n'y a pas de limitation (*) quant au nombre de vote par votant sur un proposition.

> (*) Il existe une limitation intrinsèque qui bien prise en compte dans le code, elle est très élevée, considérons comme illimité cette contrainte.

### Conditions de vote

Toute personne possédant un wallet avec une somme minimale Solana disponible est susceptible de participer à cette DAO.

Lors du vote, une somme décidée par le votant sera transférée sur le vault de la DAO.

Toute personne réunissant les conditions évoquées plus haut pourront s'enregistrer afin de pouvoir procéder à un ou plusieurs votes (_y compris sur la même proposition_)

Seules les personnes enregistrés seront susceptible de procéder aux votes.

Seules les propositions avec le status adéquat seront amenées à votes.

### Dépouillement et expression des votes

Le dépouillement pour chaque propositions se fait en fonction du déclencheur qui lui est propre.

- Si le déclencheur est un timing, le dépouillement se fait à la fin de la période de vote.
- Si le déclencheur est lié à un oracle, le dépouillement se fait lorsque le
seuil est atteint.

~Dans les deux cas, le dépouillement se fait en fonction de la somme
transférée sur le vault de la DAO.~

Les votes sont exprimés en pourcentage de la somme totale des votes sur la proposition.

- Si expression de vote "oui" > 50%, la trade est éffectuée.
- Si expression de vote "non > 50%, la trade n'est pas éffectuée et la somme remboursée aux votants.


## Prérequis

- Le programme de la DAO a été déployée et initialisée correctement.
- Les comptes des quatre votants (_Alain, Bernard, Céline, Damien et Eric_) ont été créés et possèdent un wallet permettant d'exploiter les fonctionalités de cette DAO.
- Un Oracle aurait dû être normalement intégré à la DAO pour fournir des données externes. En l'absence de celui-ci, la donnée fournie par l'oracle sera simulée...
- De même l'écoulement du temps sera simulé !


## Scénario

Le créateur de la DAO propose trois sujets de vote :

- **Proposition A** : Acheter en commun du "Alyra Coin" Si il dépasse la valeur `1337`
- **Proposition B** : Acheter du "NV Coin" dans 3 unités de temps.
- **Proposition C** : Acheter du "FM Coin" dans 7 unités de temps.

### Déroulement

|     | Actions              | A           | B           | C           |
| --- | -------------------- | ----------- | ----------- | ----------- |
| 1   | Création             | Créé        | Créé        | Créé        |
| 2   | Changement d'états   | 'Waiting'   | 'Opened'    | 'Opened'    |
| 3   | Alain vote Yes -> A  | Fail        |             |             |
| 4   | Changement d'états   | 'Opened'    |             |             |
| 5   | Check                |             |             |             |
| 6   | Alain vote Yes -> A  | Y:1 N:0     |             |             |
| 7   | Alain vote Yes -> B  | Y:1 N:0     | Y:1 N:0     |             |
|     | Check                |             |             |             |
|     | Bernard vote No -> A | Y:1 N:1     |             |             |
|     | Check                |             |             |             |
|     | Alain vote Yes -> A  | Y:2 N:1     |             |             |
|     | Céline vote Yes -> B |             | Y:2 N:0     |             |
|     | Damien vote No -> B  |             | Y:2 N:1     |             |
|     | Damien vote No -> C  |             |             | Y:0 N:1     |
|     | 3 unités de temps    |             |             |             |
|     | Check                |             | ✨ 'Closed' |             |
|     | (seuil A atteint)    |             |             |             |
|     | Check                | ✨ 'Closed' |             |             |
|     | 5 unités de temps    |             |             |             |
|     | Check                |             |             | ✨ 'Closed' |

### Résultats attendus

1. Les trois propositions ont été créees avec succès.
2. Les votes ont été correctement enregistrés pour chaque proposition.
3. Les propositions A et B  ont été approuvées avec succès
  - L'une suite seuil de déclenchement qui a été atteint.
  - L'autre suite à un nombre de votes positifs après la deadline de la proposition.
4. La proposition C a été rejetée avec succès car le nombre de votes positifs n'a pas été atteinte après la deadline.
5. Les fonds de la DAO ont été transférés ou rendus correctement en fonction du résultat de chaque proposition.

