# Ardoise

The product: expenses, services and paybacks between friends, organised in groups.

## Language

Written terms below are the only names for code, tables, tests, commits, issues and pull requests.
Speech and grilling may stay French. The UI is French. French synonyms belong in `_Avoid_`.

**Ardoise**:
The product. Not a domain object.
_Avoid_: app, tool, platform, expense report, notes de frais

**Group**:
A named set of members who keep one slate together. Bob's friends and his coworkers are two Groups.
_Avoid_: groupe, ardoise, soirée, compte, sujet, événement, event

**User**:
A person with a session. They can sit in several Groups.
_Avoid_: compte, account, personne

**Member**:
A User as they sit in a Group.
_Avoid_: membre, user (when you mean the seat), pote, siège

**Invite**:
A stable secret link that makes a User a Member of the Group. Any Member copies it.
_Avoid_: invitation, ami, annuaire, graphe, directory, friend

**Expense**:
An amount of money that actually left someone's pocket, paid by a Member, split into Parts among Participants. Label and day required.
_Avoid_: dépense, note de frais, IOU, debt, événement, event

**Service**:
A value in cents granted to a Member for an act (time, skill), not for money spent. Same Parts as an Expense. Label and day required.
_Avoid_: dépense, expense (when you mean this), événement, barter

**Participant**:
A Member included in the split of an Expense or a Service. Not necessarily every Member of the Group.
_Avoid_: member (when talking about an Expense or a Service)

**Amount**:
A sum of money in whole cents. Never a decimal. Unit of the slate, including for a Service.
_Avoid_: montant, float, euros (as stored unit)

**Payer**:
The Member who spent the money of an Expense. Not necessarily a Participant.
_Avoid_: payeur, acheteur, buyer

**Provider**:
The Member a Service is granted to. Not necessarily a Participant.
_Avoid_: prestataire, payer, vendeur, seller

**Part**:
The portion of the Amount given to a Participant. Always an equal split; leftover cents go to the Payer or the Provider.
_Avoid_: quote, percentage, part perso, share, split (as the object name)

**Balance**:
A Member's derived net position in a Group. Positive: the Group owes them. Negative: they owe the Group. Never typed in. Does not cross another Group.
_Avoid_: solde, debt, dette, solde global, global balance

**Payback**:
A transfer from one Member to another that reduces what is owed. Real money changing hands.
_Avoid_: règlement, settlement, repayment, payment, transfert, remboursement, paiement
