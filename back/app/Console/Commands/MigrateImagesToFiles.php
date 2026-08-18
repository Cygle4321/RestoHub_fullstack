<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\ImageStorage;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('restohub:images-migrate')]
#[Description('Convertit les images base64 existantes (produits, restaurants, avatars) en fichiers stockés')]
class MigrateImagesToFiles extends Command
{
    public function handle(): int
    {
        $storage = app(ImageStorage::class);
        $converted = 0;

        foreach (Product::where('image', 'like', 'data:image/%')->cursor() as $product) {
            $url = $storage->store($product->image, 'products');
            if ($url && $url !== $product->image) {
                $product->update(['image' => $url]);
                $converted++;
            }
        }

        foreach (Restaurant::where(function ($q) {
            $q->where('logo', 'like', 'data:image/%')->orWhere('cover', 'like', 'data:image/%');
        })->cursor() as $restaurant) {
            $data = [];
            foreach (['logo', 'cover'] as $field) {
                if ($restaurant->{$field} && str_starts_with($restaurant->{$field}, 'data:image/')) {
                    $url = $storage->store($restaurant->{$field}, 'restaurants');
                    if ($url && $url !== $restaurant->{$field}) {
                        $data[$field] = $url;
                        $converted++;
                    }
                }
            }
            if ($data) {
                $restaurant->update($data);
            }
        }

        foreach (User::where('avatar', 'like', 'data:image/%')->cursor() as $user) {
            $url = $storage->store($user->avatar, 'avatars');
            if ($url && $url !== $user->avatar) {
                $user->update(['avatar' => $url]);
                $converted++;
            }
        }

        $this->info("Images converties en fichiers : {$converted}");

        return self::SUCCESS;
    }
}