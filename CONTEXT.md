# Ardoise

Le produit : les dépenses, les services et les règlements entre potes, organisés en groupes.

## Language

**Ardoise**:
Le produit. Pas un objet du domaine.
_Avoid_: app, outil, plateforme, notes de frais

**Groupe**:
Un ensemble nommé de membres qui tiennent une ardoise ensemble. Les potes de Bob et ses collègues sont deux groupes.
_Avoid_: ardoise, soirée, compte, sujet, événement

**User**:
Une personne qui a une session. Elle peut siéger dans plusieurs groupes.
_Avoid_: compte, personne

**Membre**:
Un user tel qu’il siège dans un groupe.
_Avoid_: user, pote, participant, siège

**Invitation**:
Un lien secret et stable qui fait d’un user un membre du groupe. N’importe quel membre le copie.
_Avoid_: ami, annuaire, graphe

**Dépense**:
Un montant d’argent réellement sorti, payé par un membre, réparti en parts entre des participants. Libellé et jour obligatoires.
_Avoid_: note de frais, IOU, dette, événement

**Service**:
Une valeur en centimes reconnue à un membre pour un acte (temps, compétence), pas pour de l’argent sorti. Même parts qu’une dépense. Libellé et jour obligatoires.
_Avoid_: dépense, événement, barter

**Participant**:
Un membre inclus dans le partage d’une dépense ou d’un service. Pas forcément tous les membres du groupe.
_Avoid_: membre (quand on parle d’une dépense ou d’un service)

**Montant**:
Une somme d’argent en centimes entiers. Jamais un décimal. Unité de l’ardoise, y compris pour un service.
_Avoid_: float, euros (comme unité stockée)

**Payeur**:
Le membre qui a sorti l’argent d’une dépense. Pas forcément participant.
_Avoid_: acheteur

**Prestataire**:
Le membre à qui un service est reconnu. Pas forcément participant.
_Avoid_: payeur, vendeur

**Part**:
La portion du montant attribuée à un participant. Toujours un partage égal ; le centime restant va au payeur ou au prestataire.
_Avoid_: quote, pourcentage, part perso

**Solde**:
La position nette dérivée d’un membre dans un groupe. Positif : le groupe lui doit. Négatif : il doit au groupe. Jamais saisi à la main. Ne traverse pas un autre groupe.
_Avoid_: dette, solde global

**Règlement**:
Un transfert d’un membre vers un autre, qui réduit ce qui est dû. De l’argent réel qui change de mains.
_Avoid_: remboursement, paiement, transfert
