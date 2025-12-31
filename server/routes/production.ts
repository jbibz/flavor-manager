import { Router } from 'express';
import { query } from '../db';
import pool from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM production_batches ORDER BY production_date DESC, created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching production batches:', error);
    res.status(500).json({ error: 'Failed to fetch production batches' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM production_batches WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Production batch not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching production batch:', error);
    res.status(500).json({ error: 'Failed to fetch production batch' });
  }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { product_id, quantity_produced, production_date, batch_number, notes } = req.body;

    const result = await client.query(
      'INSERT INTO production_batches (product_id, quantity_produced, production_date, batch_number, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [product_id, quantity_produced, production_date, batch_number, notes || null]
    );

    await client.query(
      'UPDATE products SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2',
      [quantity_produced, product_id]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating production batch:', error);
    res.status(500).json({ error: 'Failed to create production batch' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { product_id, quantity_produced, production_date, batch_number, notes } = req.body;

    const oldBatchResult = await client.query(
      'SELECT product_id, quantity_produced FROM production_batches WHERE id = $1',
      [id]
    );

    if (oldBatchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Production batch not found' });
    }

    const oldBatch = oldBatchResult.rows[0];

    await client.query(
      'UPDATE products SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2',
      [oldBatch.quantity_produced, oldBatch.product_id]
    );

    const result = await client.query(
      'UPDATE production_batches SET product_id = $1, quantity_produced = $2, production_date = $3, batch_number = $4, notes = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [product_id, quantity_produced, production_date, batch_number, notes || null, id]
    );

    await client.query(
      'UPDATE products SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2',
      [quantity_produced, product_id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating production batch:', error);
    res.status(500).json({ error: 'Failed to update production batch' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const batchResult = await client.query(
      'SELECT product_id, quantity_produced FROM production_batches WHERE id = $1',
      [id]
    );

    if (batchResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Production batch not found' });
    }

    const batch = batchResult.rows[0];

    await client.query(
      'UPDATE products SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2',
      [batch.quantity_produced, batch.product_id]
    );

    await client.query('DELETE FROM production_batches WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting production batch:', error);
    res.status(500).json({ error: 'Failed to delete production batch' });
  } finally {
    client.release();
  }
});

export default router;
