/*
  Warnings:

  - You are about to drop the column `cuentaId` on the `grupo` table. All the data in the column will be lost.
  - You are about to drop the column `cuentaId` on the `transaccion` table. All the data in the column will be lost.
  - You are about to drop the `cuenta` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `billeteraId` to the `Grupo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `billeteraId` to the `Transaccion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `grupo` DROP FOREIGN KEY `Grupo_cuentaId_fkey`;

-- DropForeignKey
ALTER TABLE `transaccion` DROP FOREIGN KEY `Transaccion_cuentaId_fkey`;

-- AlterTable
ALTER TABLE `grupo` DROP COLUMN `cuentaId`,
    ADD COLUMN `billeteraId` INTEGER NOT NULL,
    ADD COLUMN `orden` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `transaccion` DROP COLUMN `cuentaId`,
    ADD COLUMN `billeteraId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `cuenta`;

-- CreateTable
CREATE TABLE `Billetera` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#3b82f6',
    `orden` INTEGER NOT NULL DEFAULT 0,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'activa',
    `incluirEnKpis` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Billetera_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transferencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `monto` DOUBLE NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `comentario` VARCHAR(191) NULL,
    `origenId` INTEGER NOT NULL,
    `destinoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Grupo_billeteraId_idx` ON `Grupo`(`billeteraId`);

-- CreateIndex
CREATE INDEX `Transaccion_billeteraId_idx` ON `Transaccion`(`billeteraId`);

-- AddForeignKey
ALTER TABLE `Grupo` ADD CONSTRAINT `Grupo_billeteraId_fkey` FOREIGN KEY (`billeteraId`) REFERENCES `Billetera`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaccion` ADD CONSTRAINT `Transaccion_billeteraId_fkey` FOREIGN KEY (`billeteraId`) REFERENCES `Billetera`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transferencia` ADD CONSTRAINT `Transferencia_origenId_fkey` FOREIGN KEY (`origenId`) REFERENCES `Billetera`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transferencia` ADD CONSTRAINT `Transferencia_destinoId_fkey` FOREIGN KEY (`destinoId`) REFERENCES `Billetera`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
