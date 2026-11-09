-- CreateTable
CREATE TABLE IF NOT EXISTS `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(191) NOT NULL,
    `unitPriceSnapshot` DECIMAL(10, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    `selectedOptionsJson` TEXT NULL,

    INDEX `OrderItem_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `method` ENUM('UPI', 'CARD') NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'FAILED') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `transactionRef` VARCHAR(191) NULL,
    `failureReason` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,

    UNIQUE INDEX `Payment_transactionRef_key`(`transactionRef`),
    INDEX `Payment_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
