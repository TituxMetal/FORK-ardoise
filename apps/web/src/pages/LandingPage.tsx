import { Link } from '~/lib/router'

export const LandingPage = () => (
  <section className="space-y-6">
    <h2 className="text-3xl font-semibold">Une ardoise partagée pour les comptes d’un Groupe</h2>
    <div className="space-y-3 text-dim">
      <p>
        Chacun note ses Dépenses, Services et Règlements. Ardoise en déduit le Solde de chaque
        membre — personne ne les tape : ils découlent de ce que le Groupe enregistre.
      </p>
      <p>Créer un compte et un premier Groupe est gratuit : aucune invitation n’est nécessaire.</p>
    </div>
    <Link
      to="/session"
      className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-4 font-semibold text-on-accent hover:bg-accent/90"
    >
      Créer un compte
    </Link>
  </section>
)
