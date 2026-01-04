import { useUIStore } from '../stores';
import { HabitForm } from './Forms/HabitForm';
import { CategoryForm } from './Forms/CategoryForm';
import { ProjectForm } from './Forms/ProjectForm';
import { TagForm } from './Forms/TagForm';
import { DashboardPageForm } from './Forms/DashboardPageForm';
import { IconBrowser } from './IconBrowser';
import { HabitDetailModal } from '../widgets/HabitMatrix/HabitDetailModal';
import { WidgetCatalog } from './Dashboard/WidgetCatalog';
import { ParkingLotItemModal } from '../widgets/ParkingLot/ParkingLotItemModal';
import { StatusForm } from './Forms/StatusForm';
import * as MuiIcons from '@mui/icons-material';

// Settings Modal placeholder
function SettingsModal() {
  const { closeModal } = useUIStore();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                <MuiIcons.Settings style={{ color: 'white', fontSize: 24 }} />
              </div>
              <h2 className="text-xl font-semibold text-white">Settings</h2>
            </div>
            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
            >
              <MuiIcons.Close style={{ fontSize: 20 }} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-400 text-center py-8">
            Settings panel coming soon...
          </p>
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirm Delete Modal
function ConfirmDeleteModal() {
  const { closeModal, modalData } = useUIStore();
  const data = modalData as { title?: string; message?: string; onConfirm?: () => void } | undefined;

  const handleConfirm = () => {
    data?.onConfirm?.();
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <MuiIcons.DeleteOutline style={{ color: 'white', fontSize: 24 }} />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {data?.title || 'Confirm Delete'}
            </h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-300">
            {data?.message || 'Are you sure you want to delete this item? This action cannot be undone.'}
          </p>
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Task Form placeholder (since it wasn't in the requirements but referenced)
function TaskForm() {
  const { closeModal } = useUIStore();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <MuiIcons.AddTask style={{ color: 'white', fontSize: 24 }} />
              </div>
              <h2 className="text-xl font-semibold text-white">Add Task</h2>
            </div>
            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
            >
              <MuiIcons.Close style={{ fontSize: 20 }} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-400 text-center py-8">
            Task form coming soon...
          </p>
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Time Block Form placeholder
function TimeBlockForm() {
  const { closeModal } = useUIStore();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <MuiIcons.Schedule style={{ color: 'white', fontSize: 24 }} />
              </div>
              <h2 className="text-xl font-semibold text-white">Time Block</h2>
            </div>
            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
            >
              <MuiIcons.Close style={{ fontSize: 20 }} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-400 text-center py-8">
            Time block form coming soon...
          </p>
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={closeModal}
            className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalManager() {
  const { activeModal, previousModal } = useUIStore();

  if (!activeModal) return null;

  // For nested modals (like icon-picker opened from a form),
  // keep the parent modal mounted to preserve its state
  const isIconPickerOpen = activeModal === 'icon-picker';
  const parentModalType = isIconPickerOpen ? previousModal : null;

  // Determine which form modal should be shown (either as active or as parent behind icon picker)
  const formModalToShow = isIconPickerOpen ? parentModalType : activeModal;

  return (
    <>
      {/* Form modals - stay mounted when icon picker is open on top */}
      {formModalToShow === 'habit-form' && (
        <div style={{ visibility: isIconPickerOpen ? 'hidden' : 'visible' }}>
          <HabitForm />
        </div>
      )}
      {formModalToShow === 'project-form' && (
        <div style={{ visibility: isIconPickerOpen ? 'hidden' : 'visible' }}>
          <ProjectForm />
        </div>
      )}
      {formModalToShow === 'category-form' && (
        <div style={{ visibility: isIconPickerOpen ? 'hidden' : 'visible' }}>
          <CategoryForm />
        </div>
      )}
      {formModalToShow === 'status-form' && (
        <div style={{ visibility: isIconPickerOpen ? 'hidden' : 'visible' }}>
          <StatusForm />
        </div>
      )}
      {formModalToShow === 'dashboard-page-form' && (
        <div style={{ visibility: isIconPickerOpen ? 'hidden' : 'visible' }}>
          <DashboardPageForm />
        </div>
      )}

      {/* Non-form modals - render normally */}
      {activeModal === 'habit-detail' && <HabitDetailModal />}
      {activeModal === 'task-form' && <TaskForm />}
      {activeModal === 'tag-form' && <TagForm />}
      {activeModal === 'time-block-form' && <TimeBlockForm />}
      {activeModal === 'settings' && <SettingsModal />}
      {activeModal === 'confirm-delete' && <ConfirmDeleteModal />}
      {activeModal === 'widget-catalog' && <WidgetCatalog />}
      {activeModal === 'parking-lot-item' && <ParkingLotItemModal />}

      {/* Icon picker - renders on top when active */}
      {isIconPickerOpen && <IconBrowser />}
    </>
  );
}

export default ModalManager;
