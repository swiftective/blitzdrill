<script setup lang="ts">
import { ref } from 'vue';
import type { Study } from '../lib/chess';

const props = defineProps<{
  studies: Study[];
  currentStudyId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', study: Study): void;
  (e: 'create', name: string, pgn: string, defaultColor: 'white' | 'black'): void;
  (e: 'update', study: Study): void;
  (e: 'delete', id: string): void;
}>();

const showCreateForm = ref(false);
const newStudyName = ref('');
const newStudyPgn = ref('');
const newStudyColor = ref<'white' | 'black'>('white');

const editingStudy = ref<Study | null>(null);
const editName = ref('');
const editPgn = ref('');
const editColor = ref<'white' | 'black'>('white');

const handleCreate = () => {
  if (newStudyName.value.trim() && newStudyPgn.value.trim()) {
    emit('create', newStudyName.value.trim(), newStudyPgn.value.trim(), newStudyColor.value);
    newStudyName.value = '';
    newStudyPgn.value = '';
    newStudyColor.value = 'white';
    showCreateForm.value = false;
  }
};

const startEdit = (study: Study) => {
  editingStudy.value = study;
  editName.value = study.name;
  editPgn.value = study.pgn;
  editColor.value = study.defaultColor || 'white';
};

const cancelEdit = () => {
  editingStudy.value = null;
  editName.value = '';
  editPgn.value = '';
};

const saveEdit = () => {
  if (editingStudy.value && editName.value.trim()) {
    emit('update', {
      ...editingStudy.value,
      name: editName.value.trim(),
      pgn: editPgn.value.trim(),
      defaultColor: editColor.value,
    });
    cancelEdit();
  }
};

const confirmDelete = (study: Study) => {
  if (confirm(`Delete "${study.name}"?`)) {
    emit('delete', study.id);
  }
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
</script>

<template>
  <div class="study-manager">
    <div class="section-header">
      <h3>Tactical Studies</h3>
      <button
        @click="showCreateForm = !showCreateForm"
        class="btn-add"
        :class="{ active: showCreateForm }"
      >
        <span class="plus">{{ showCreateForm ? '×' : '+' }}</span>
      </button>
    </div>

    <!-- Forms Area -->
    <transition name="expand">
      <div v-if="showCreateForm" class="form-container create-mode">
        <div class="form-group">
          <label>Study Name</label>
          <input v-model="newStudyName" type="text" placeholder="e.g. Nimzo-Indian Defense" class="styled-input" />
        </div>

        <div class="form-group">
          <label>Player Color</label>
          <div class="mini-toggle">
            <button :class="{ active: newStudyColor === 'white' }" @click="newStudyColor = 'white'">White</button>
            <button :class="{ active: newStudyColor === 'black' }" @click="newStudyColor = 'black'">Black</button>
          </div>
        </div>

        <div class="form-group">
          <label>PGN Data</label>
          <textarea v-model="newStudyPgn" placeholder="Paste PGN moves..." class="styled-textarea"></textarea>
        </div>

        <button @click="handleCreate" class="btn-submit" :disabled="!newStudyName || !newStudyPgn">
          Initialize Study
        </button>
      </div>
    </transition>

    <transition name="expand">
      <div v-if="editingStudy" class="form-container edit-mode">
        <div class="form-header">
          <h4>Edit Study</h4>
          <button @click="cancelEdit" class="btn-close">×</button>
        </div>

        <div class="form-group">
          <label>Study Name</label>
          <input v-model="editName" type="text" class="styled-input" />
        </div>

        <div class="form-group">
          <label>Player Color</label>
          <div class="mini-toggle">
            <button :class="{ active: editColor === 'white' }" @click="editColor = 'white'">White</button>
            <button :class="{ active: editColor === 'black' }" @click="editColor = 'black'">Black</button>
          </div>
        </div>

        <div class="form-group">
          <label>PGN Data</label>
          <textarea v-model="editPgn" class="styled-textarea"></textarea>
        </div>

        <div class="form-actions">
          <button @click="saveEdit" class="btn-submit">Save Changes</button>
        </div>
      </div>
    </transition>

    <!-- Study List -->
    <div class="study-list" v-if="!editingStudy">
      <div
        v-for="study in studies"
        :key="study.id"
        class="study-card"
        :class="{ active: study.id === currentStudyId }"
        @click="emit('select', study)"
      >
        <div class="card-status" :class="study.defaultColor"></div>
        <div class="card-main">
          <div class="study-name">{{ study.name }}</div>
          <div class="study-meta">
            <span class="date">{{ formatDate(study.updatedAt) }}</span>
            <span class="dot-sep">•</span>
            <span class="color-tag">{{ study.defaultColor }}</span>
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button @click="startEdit(study)" class="icon-btn edit" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button @click="confirmDelete(study)" class="icon-btn delete" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </div>

      <div v-if="studies.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <p>No studies identified in the database.</p>
        <p class="sub">Create your first tactical opening study.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.study-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--text-dark);
  font-weight: 800;
  font-family: var(--font-mono);
}

.btn-add {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-deep);
  color: var(--text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-add:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  box-shadow: 0 0 10px rgba(204, 255, 0, 0.2);
}

.btn-add.active {
  background: var(--accent-primary);
  color: #000;
  border-color: var(--accent-primary);
}

.plus {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}

/* Forms */
.form-container {
  background: var(--bg-surface);
  border: 1px solid var(--accent-primary);
  border-radius: 4px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 0 30px rgba(204, 255, 0, 0.05);
}

.form-header h4 {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: var(--font-mono);
  color: var(--accent-primary);
}

.form-group label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: var(--text-dark);
  font-family: var(--font-mono);
}

.styled-input, .styled-textarea {
  background: #000;
  border: 1px solid var(--border-subtle);
  border-radius: 2px;
  padding: 0.75rem;
  color: var(--text-bright);
  font-size: 0.85rem;
  font-family: var(--font-mono);
}

.styled-input:focus, .styled-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 10px rgba(204, 255, 0, 0.1);
}

.btn-submit {
  background: var(--accent-primary);
  color: #000;
  border: none;
  padding: 1rem;
  border-radius: 2px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: var(--font-mono);
  cursor: pointer;
  margin-top: 0.5rem;
}

/* Study List */
.study-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.study-card {
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.study-card:hover {
  border-color: var(--text-dark);
  background: rgba(255, 255, 255, 0.02);
  transform: none;
}

.study-card.active {
  background: rgba(204, 255, 0, 0.03);
  border-color: var(--accent-primary);
  box-shadow: inset 0 0 15px rgba(204, 255, 0, 0.02);
}

.study-card.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 2px;
  background: var(--accent-primary);
}

.card-status {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.card-status.white {
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
}

.card-status.black {
  background: #1a1a1a;
  border: 1px solid #333;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
}

.study-name {
  font-weight: 700;
  color: var(--text-bright);
  font-size: 0.8rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.study-meta {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: var(--text-dark);
}

.color-tag {
  color: var(--text-dim);
}

.btn-add {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-add:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.btn-add.active {
  background: var(--accent-primary);
  color: var(--bg-deep);
}

.plus {
  font-size: 1.25rem;
  font-weight: 300;
  line-height: 1;
}

/* Forms */
.form-container {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.form-header h4 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--accent-primary);
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-dark);
}

.styled-input {
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  color: var(--text-bright);
  font-size: 0.9rem;
}

.styled-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.styled-textarea {
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  color: var(--text-main);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  min-height: 120px;
  resize: vertical;
}

.styled-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.mini-toggle {
  display: flex;
  background: var(--bg-deep);
  padding: 2px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
}

.mini-toggle button {
  flex: 1;
  padding: 0.4rem;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
}

.mini-toggle button.active {
  background: var(--bg-elevated);
  color: var(--text-bright);
}

.btn-submit {
  background: var(--accent-primary);
  color: var(--bg-deep);
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.5rem;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Study List */
.study-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.study-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.study-card:hover {
  transform: translateX(4px);
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.03);
}

.study-card.active {
  background: rgb(30 13 51 / 3%);
  border-color: var(--accent-primary);
}

.card-status {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
}

.card-status.white { background: #fff; box-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
.card-status.black { background: #444; border: 1px solid #666; }

.card-main {
  flex: 1;
  min-width: 0;
}

.study-name {
  font-weight: 700;
  color: var(--text-bright);
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.study-meta {
  font-size: 0.75rem;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.2rem;
}

.color-tag {
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
}

.dot-sep { opacity: 0.3; }

.card-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.study-card:hover .card-actions {
  opacity: 1;
}

.icon-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  border-radius: 6px;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-bright);
}

.icon-btn.delete:hover {
  color: var(--accent-secondary);
  background: rgba(255, 0, 255, 0.1);
}

.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-dim);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p { margin: 0; font-weight: 600; font-size: 0.9rem; }
.empty-state .sub { font-size: 0.8rem; font-weight: 400; margin-top: 0.5rem; opacity: 0.7; }

/* Transitions */
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; max-height: 400px; opacity: 1; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; margin-bottom: 0; padding-top: 0; padding-bottom: 0; overflow: hidden; }
</style>
