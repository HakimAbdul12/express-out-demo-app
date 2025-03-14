/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('pricing_orders', (table) => {
        table.increments('id').primary();
        table.string('listingId').notNullable().unique();
        table.boolean('createAd').defaultTo(true);
        table.boolean('basicAd').defaultTo(true);
        table.boolean('autocheck').defaultTo(false);
        table.boolean('adManagement').defaultTo(false);
        table.integer('adSpend').defaultTo(0);
        table.boolean('hdVideo').defaultTo(false);
        table.boolean('youtubePublish').defaultTo(false);
        table.integer('youtubeBoost').defaultTo(0).checkIn([0, 10, 20, 30]);
        table.boolean('googleAds').defaultTo(false);
        table.integer('googleBudget').defaultTo(0);
        table.boolean('noRefund').defaultTo(true);
        table.decimal('totalPrice', 10, 2).notNullable();
        table.boolean('isPaid').defaultTo(false);
        table.timestamp('createdAt').defaultTo(knex.fn.now());
        table.timestamp('updatedAt').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('pricing_orders');
};
