-- CreateTable
CREATE TABLE `Ingreso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cantidad` DOUBLE NOT NULL,
    `descripcion` TEXT NOT NULL,
    `categoria` VARCHAR(191) NOT NULL DEFAULT 'General',
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notas` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Ingreso_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Egreso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cantidad` DOUBLE NOT NULL,
    `descripcion` TEXT NOT NULL,
    `categoria` VARCHAR(191) NOT NULL DEFAULT 'General',
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notas` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Egreso_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
