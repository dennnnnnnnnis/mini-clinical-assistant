const { v4: uuidv4 } = require('uuid');
const db = require('../database/database');

async function patientRoutes(fastify, options) {
  // Get all patients with optional search
  fastify.get('/', async (request, reply) => {
    try {
      const { search, limit = 50, offset = 0 } = request.query;
      
      let query = `
        SELECT 
          id, first_name, last_name, date_of_birth, gender, 
          phone, email, medical_record_number, created_at, updated_at,
          (SELECT COUNT(*) FROM clinical_notes WHERE patient_id = patients.id) as notes_count
        FROM patients
      `;
      
      const params = [];
      
      if (search) {
        query += ` WHERE 
          first_name LIKE ? OR 
          last_name LIKE ? OR 
          medical_record_number LIKE ? OR
          email LIKE ?
        `;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      query += ` ORDER BY last_name, first_name LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));
      
      const stmt = db.prepare(query);
      const patients = stmt.all(...params);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM patients';
      const countParams = [];
      
      if (search) {
        countQuery += ` WHERE 
          first_name LIKE ? OR 
          last_name LIKE ? OR 
          medical_record_number LIKE ? OR
          email LIKE ?
        `;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      const countStmt = db.prepare(countQuery);
      const { total } = countStmt.get(...countParams);
      
      return {
        patients,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + parseInt(limit)) < total
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching patients:', error);
      reply.status(500).send({ error: 'Failed to fetch patients' });
    }
  });

  // Get patient by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const stmt = db.prepare(`
        SELECT 
          id, first_name, last_name, date_of_birth, gender,
          phone, email, address, medical_record_number, 
          created_at, updated_at
        FROM patients 
        WHERE id = ?
      `);
      
      const patient = stmt.get(id);
      
      if (!patient) {
        reply.status(404).send({ error: 'Patient not found' });
        return;
      }
      
      // Get recent notes for this patient
      const notesStmt = db.prepare(`
        SELECT id, title, note_type, created_at 
        FROM clinical_notes 
        WHERE patient_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      
      const recentNotes = notesStmt.all(id);
      
      return {
        ...patient,
        recent_notes: recentNotes
      };
    } catch (error) {
      fastify.log.error('Error fetching patient:', error);
      reply.status(500).send({ error: 'Failed to fetch patient' });
    }
  });

  // Create new patient
  fastify.post('/', async (request, reply) => {
    try {
      const {
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        medical_record_number
      } = request.body;

      // Validate required fields
      if (!first_name || !last_name || !date_of_birth) {
        reply.status(400).send({ 
          error: 'Missing required fields: first_name, last_name, date_of_birth' 
        });
        return;
      }

      // Generate unique MRN if not provided
      let mrn = medical_record_number;
      if (!mrn) {
        mrn = 'MRN' + Date.now().toString().slice(-8);
      }

      const id = uuidv4();
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO patients (
          id, first_name, last_name, date_of_birth, gender,
          phone, email, address, medical_record_number, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      try {
        stmt.run(
          id, first_name, last_name, date_of_birth, gender,
          phone, email, address, mrn, now, now
        );

        // Return created patient
        const getStmt = db.prepare('SELECT * FROM patients WHERE id = ?');
        const newPatient = getStmt.get(id);

        reply.status(201).send(newPatient);
      } catch (dbError) {
        if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          reply.status(409).send({ error: 'Medical record number already exists' });
        } else {
          throw dbError;
        }
      }
    } catch (error) {
      fastify.log.error('Error creating patient:', error);
      reply.status(500).send({ error: 'Failed to create patient' });
    }
  });

  // Update patient
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const {
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        medical_record_number
      } = request.body;

      // Check if patient exists
      const checkStmt = db.prepare('SELECT id FROM patients WHERE id = ?');
      const existingPatient = checkStmt.get(id);
      
      if (!existingPatient) {
        reply.status(404).send({ error: 'Patient not found' });
        return;
      }

      const now = new Date().toISOString();

      const stmt = db.prepare(`
        UPDATE patients SET 
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          date_of_birth = COALESCE(?, date_of_birth),
          gender = COALESCE(?, gender),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          address = COALESCE(?, address),
          medical_record_number = COALESCE(?, medical_record_number),
          updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        first_name, last_name, date_of_birth, gender,
        phone, email, address, medical_record_number, now, id
      );

      // Return updated patient
      const getStmt = db.prepare('SELECT * FROM patients WHERE id = ?');
      const updatedPatient = getStmt.get(id);

      return updatedPatient;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        reply.status(409).send({ error: 'Medical record number already exists' });
      } else {
        fastify.log.error('Error updating patient:', error);
        reply.status(500).send({ error: 'Failed to update patient' });
      }
    }
  });

  // Delete patient
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Check if patient exists
      const checkStmt = db.prepare('SELECT id FROM patients WHERE id = ?');
      const existingPatient = checkStmt.get(id);
      
      if (!existingPatient) {
        reply.status(404).send({ error: 'Patient not found' });
        return;
      }

      // Delete patient (notes will be cascade deleted)
      const deleteStmt = db.prepare('DELETE FROM patients WHERE id = ?');
      deleteStmt.run(id);

      reply.status(204).send();
    } catch (error) {
      fastify.log.error('Error deleting patient:', error);
      reply.status(500).send({ error: 'Failed to delete patient' });
    }
  });
}

module.exports = patientRoutes;