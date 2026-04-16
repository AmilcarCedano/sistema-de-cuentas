-- AlterTable
ALTER TABLE `transaccion` ADD COLUMN `grupoId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Grupo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#3b82f6',
    `cuentaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Grupo_cuentaId_idx`(`cuentaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Transaccion_grupoId_idx` ON `Transaccion`(`grupoId`);

-- AddForeignKey
ALTER TABLE `Grupo` ADD CONSTRAINT `Grupo_cuentaId_fkey` FOREIGN KEY (`cuentaId`) REFERENCES `Cuenta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaccion` ADD CONSTRAINT `Transaccion_grupoId_fkey` FOREIGN KEY (`grupoId`) REFERENCES `Grupo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
