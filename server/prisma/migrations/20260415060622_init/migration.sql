/*
  Warnings:

  - You are about to drop the `egreso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ingreso` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `egreso`;

-- DropTable
DROP TABLE `ingreso`;

-- CreateTable
CREATE TABLE `Cuenta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'activa',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Cuenta_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaccion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `monto` DOUBLE NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `comentario` TEXT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `cuentaId` INTEGER NOT NULL,

    INDEX `Transaccion_cuentaId_idx`(`cuentaId`),
    INDEX `Transaccion_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaccion` ADD CONSTRAINT `Transaccion_cuentaId_fkey` FOREIGN KEY (`cuentaId`) REFERENCES `Cuenta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
