import { Link } from '~/lib/router'

type Props = {
  session?: { name: string } | null
}

type LexiconEntry = {
  anchor: string
  term: string
  definition: string
  example: string
}

const ENTRIES: LexiconEntry[] = [
  {
    anchor: 'groupe',
    term: 'Groupe',
    definition:
      'Un Groupe réunit des personnes autour d’une seule ardoise : ce que le cercle y enregistre y reste, et les comptes des autres cercles n’y paraissent jamais.',
    example:
      '« Potes de Bob » est un Groupe : il apparaît dans la liste « Mes Groupes » avec son ardoise et ses membres.'
  },
  {
    anchor: 'depense',
    term: 'Dépense',
    definition:
      'Une Dépense est de l’argent réellement sorti de la poche d’un membre — le Payeur — pour le Groupe ; sa somme est répartie en parts égales entre les Participants.',
    example:
      '« Pizza », 24,00 € payés par Léa et partagés entre amis : une Dépense à constater dans l’onglet « Dépenses ».'
  },
  {
    anchor: 'service',
    term: 'Service',
    definition:
      'Un Service est une valeur accordée à un membre pour un acte — du temps, un coup de main, une compétence — et non pour de l’argent dépensé ; il se partage comme une Dépense.',
    example:
      'Bob déménage Léa : on constate un Service de 30,00 € avec Bob comme Prestataire, dans l’onglet « Services ».'
  },
  {
    anchor: 'reglement',
    term: 'Règlement',
    definition:
      'Un Règlement est un versement d’un membre à un autre qui réduit ce qui est dû : le Débiteur paie le Créancier, dans la limite de ce que les Soldes autorisent.',
    example:
      'Dans l’onglet « Règlements », « Ajouter un Règlement » : Bob verse 5,00 € à Léa pour éteindre une partie de ce qu’il doit.'
  },
  {
    anchor: 'solde',
    term: 'Solde',
    definition:
      'Le Solde d’un membre est sa position nette dans le Groupe : s’il est positif, le Groupe lui doit ; s’il est négatif, il doit au Groupe. Il se recalcule à chaque écriture, jamais il ne se saisit à la main.',
    example:
      '« Ton solde » affiche « On te doit 12,00 € » ou « Tu dois 3,50 € » après chaque écriture.'
  },
  {
    anchor: 'invitation',
    term: 'Invitation',
    definition:
      'Une Invitation est le lien secret qu’un membre copie pour faire entrer quelqu’un dans son Groupe : c’est la seule porte d’un Groupe existant.',
    example:
      '« Copier le lien d’Invitation » produit le lien secret qui ouvre la page « Invitation » du Groupe, où un nouveau venu se crée un compte puis rejoint avec « Rejoindre le Groupe ».'
  }
]

export const AboutPage = ({ session = null }: Props) => (
  <section className="space-y-6">
    <h2 className="text-3xl font-semibold">À propos d’Ardoise</h2>
    <div className="space-y-3 text-dim">
      <p>
        Ardoise tient, pour chaque Groupe, une ardoise partagée : les membres y enregistrent leurs
        Dépenses, Services et Règlements, et Ardoise calcule le reste.
      </p>
      <p>
        Aucun Solde n’est saisi à la main : les Soldes découlent de ce que les membres enregistrent.
      </p>
    </div>
    <div className="space-y-4">
      {ENTRIES.map(entry => (
        <article
          id={entry.anchor}
          key={entry.anchor}
          className="space-y-1 rounded-lg border border-border bg-surface p-4"
        >
          <h3 className="font-medium">{entry.term}</h3>
          <p className="text-dim">{entry.definition}</p>
          <p className="text-dim">Exemple : {entry.example}</p>
        </article>
      ))}
    </div>
    <div className="space-y-3">
      <h3 className="text-lg font-medium">Ce qu’Ardoise ne fait pas</h3>
      <ul className="list-disc space-y-1 pl-5 text-dim">
        <li>
          Les Groupes sont des pièces fermées : seuls leurs membres voient l’ardoise du Groupe et y
          écrivent.
        </li>
        <li>
          Les Soldes ne passent jamais d’un Groupe à un autre : chaque ardoise reste dans son
          Groupe.
        </li>
        <li>
          Rejoindre un Groupe existant demande une Invitation : seul un membre du Groupe peut en
          créer une, et elle reste secrète.
        </li>
        <li>
          Ardoise enregistre et calcule, rien de plus : elle ne détient pas d’argent et n’en déplace
          pas. Les Règlements se font entre membres.
        </li>
      </ul>
    </div>
    {session === null ? (
      <div className="space-y-3">
        <p className="text-dim">
          Créer un compte et un premier Groupe est gratuit : aucune invitation n’est nécessaire.
        </p>
        <Link
          to="/session"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-4 font-semibold text-on-accent hover:bg-accent/90"
        >
          Créer un compte
        </Link>
      </div>
    ) : null}
  </section>
)
