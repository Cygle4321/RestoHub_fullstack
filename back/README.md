# RestoHub API (`back/`)

Backend Laravel du monorepo **restaurant-saas**.

Voir le README racine : [`../README.md`](../README.md)

## Démarrage rapide

```bash
composer install --ignore-platform-reqs
cp .env.example .env
php artisan key:generate
# configurer DB + FEDAPAY_*
php artisan migrate --seed
php artisan serve
```

Front associé : `../front` avec `VITE_API_URL=http://localhost:8000/api`
