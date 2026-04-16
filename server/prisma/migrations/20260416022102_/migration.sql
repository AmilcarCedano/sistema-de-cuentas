/*
  Warnings:

  - You are about to drop the column `billeteraId` on the `grupo` table. All the data in the column will be lost.
  - You are about to drop the column `billeteraId` on the `transaccion` table. All the data in the column will be lost.
  - You are about to drop the `billetera` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transferencia` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cuentaId` to the `Grupo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cuentaId` to the `Transaccion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `grupo` DROP FOREIGN KEY `Grupo_billeteraId_fkey`;

-- DropForeignKey
ALTER TABLE `transaccion` DROP FOREIGN KEY `Transaccion_billeteraId_fkey`;

-- DropForeignKey
ALTER TABLE `transferencia` DROP FOREIGN KEY `Transferencia_destinoId_fkey`;

-- DropForeignKey
ALTER TABLE `transferencia` DROP FOREIGN KEY `Transferencia_origenId_fkey`;

-- AlterTable
ALTER TABLE `grupo` DROP COLUMN `billeteraId`,
    ADD COLUMN `cuentaId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `transaccion` DROP COLUMN `billeteraId`,
    ADD COLUMN `cuentaId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `billetera`;

-- DropTable
DROP TABLE `transferencia`;

-- CreateTable
CREATE TABLE `Cuenta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#3b82f6',
    `orden` INTEGER NOT NULL DEFAULT 0,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'activa',
    `incluirEnKpis` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Cuenta_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaldoManual` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `monto` DOUBLE NOT NULL,
    `cuentaId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Grupo_cuentaId_idx` ON `Grupo`(`cuentaId`);

-- CreateIndex
CREATE INDEX `Transaccion_cuentaId_idx` ON `Transaccion`(`cuentaId`);

-- AddForeignKey
ALTER TABLE `SaldoManual` ADD CONSTRAINT `SaldoManual_cuentaId_fkey` FOREIGN KEY (`cuentaId`) REFERENCES `Cuenta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Grupo` ADD CONSTRAINT `Grupo_cuentaId_fkey` FOREIGN KEY (`cuentaId`) REFERENCES `Cuenta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaccion` ADD CONSTRAINT `Transaccion_cuentaId_fkey` FOREIGN KEY (`cuentaId`) REFERENCES `Cuenta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
