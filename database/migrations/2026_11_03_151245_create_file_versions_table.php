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
        Schema::create('file_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('file_entry_id')->constrained('file_entries')->cascadeOnDelete();
            $table->unsignedInteger('version_number')->default(1);
            $table->string('path');
            $table->unsignedBigInteger('size')->default(0);
            $table->string('mime_type')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['file_entry_id', 'version_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('file_versions');
    }
};
