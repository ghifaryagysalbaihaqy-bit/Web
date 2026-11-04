<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('file_entries', function (Blueprint $table) {
            $table->json('tags')->nullable()->after('is_starred');
            $table->boolean('is_locked')->default(false)->after('tags');
            $table->string('checksum', 64)->nullable()->index()->after('is_locked');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('file_entries', function (Blueprint $table) {
            $table->dropColumn(['tags', 'is_locked', 'checksum']);
        });
    }
};
