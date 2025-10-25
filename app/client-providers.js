"use client";
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTaskModal = useTaskModal;
exports.default = ClientProviders;
var react_1 = require("react");
var drawer_1 = require("@/components/ui/drawer");
var dynamic_1 = require("next/dynamic");
var EditTaskForm = (0, dynamic_1.default)(function () { return Promise.resolve().then(function () { return require('@/components/widgets/edit-task-form'); }).then(function (mod) { return ({ default: mod.EditTaskForm }); }); }, {
    ssr: false,
    loading: function () { return (<div style={{ padding: '2rem', color: 'white' }}>
        Loading form...
      </div>); }
});
var react_query_1 = require("@tanstack/react-query");
var icons_1 = require("@/components/icons");
var dropdown_menu_1 = require("@/components/ui/dropdown-menu");
var button_1 = require("@/components/ui/button");
var client_providers_module_css_1 = require("./client-providers.module.css");
var TaskModalContext = (0, react_1.createContext)(undefined);
function useTaskModal() {
    var context = (0, react_1.useContext)(TaskModalContext);
    if (context === undefined) {
        throw new Error('useTaskModal must be used within a TaskModalProvider');
    }
    return context;
}
function ClientProviders(_a) {
    var _this = this;
    var children = _a.children;
    var queryClient = (0, react_query_1.useQueryClient)();
    var _b = (0, react_1.useState)(null), activeTaskId = _b[0], setActiveTaskId = _b[1];
    var _c = (0, react_1.useState)(null), newTaskText = _c[0], setNewTaskText = _c[1];
    var _d = (0, react_1.useState)(false), isCreatingNew = _d[0], setIsCreatingNew = _d[1];
    var _e = (0, react_1.useState)(new Set()), taskUpdateCallbacks = _e[0], setTaskUpdateCallbacks = _e[1];
    // Fetch individual task data when activeTaskId changes
    var _f = (0, react_1.useState)(null), activeTask = _f[0], setActiveTask = _f[1];
    (0, react_1.useEffect)(function () {
        var fetchTask = function (taskId) { return __awaiter(_this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log('Fetching task with ID:', taskId);
                        return [4 /*yield*/, fetch("/api/tasks?id=".concat(taskId))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        console.log('Task from API:', data.data);
                        setActiveTask(data.data || null);
                        return [3 /*break*/, 4];
                    case 3:
                        console.error('Failed to fetch task');
                        setActiveTask(null);
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Error fetching task:', error_1);
                        setActiveTask(null);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        if (activeTaskId) {
            fetchTask(activeTaskId);
        }
        else if (newTaskText !== null) {
            // For new tasks, set activeTask to null immediately to open drawer
            setActiveTask(null);
        }
    }, [activeTaskId, newTaskText]);
    var handleModalClose = function () {
        setActiveTaskId(null);
        setNewTaskText(null);
        setIsCreatingNew(false);
        // Clear task data immediately to prevent stale data flash
        setActiveTask(null);
    };
    var registerTaskUpdateCallback = (0, react_1.useCallback)(function (callback) {
        setTaskUpdateCallbacks(function (prev) { return new Set(prev).add(callback); });
    }, []);
    var unregisterTaskUpdateCallback = (0, react_1.useCallback)(function (callback) {
        setTaskUpdateCallbacks(function (prev) {
            var next = new Set(prev);
            next.delete(callback);
            return next;
        });
    }, []);
    var handleModalSave = (0, react_1.useCallback)(function (updatedTask, operation) {
        // Don't close the modal on save - let user close it manually
        // Just invalidate queries to refresh the task list
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        // Call all registered task update callbacks with specific task data
        taskUpdateCallbacks.forEach(function (callback) {
            try {
                callback(updatedTask, operation);
            }
            catch (error) {
                console.error('Error calling task update callback:', error);
            }
        });
        // Close modal after delete
        if (operation === 'delete') {
            handleModalClose();
        }
    }, [queryClient, taskUpdateCallbacks]);
    var handleDeleteTask = function () { return __awaiter(_this, void 0, void 0, function () {
        var taskToDelete, res, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(activeTask === null || activeTask === void 0 ? void 0 : activeTask.id))
                        return [2 /*return*/];
                    taskToDelete = activeTask;
                    handleModalSave(taskToDelete, 'delete');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/tasks?id=".concat(taskToDelete.id), {
                            method: 'DELETE',
                        })];
                case 2:
                    res = _a.sent();
                    if (!res.ok) {
                        // If delete fails, refresh the task list
                        console.error('Failed to delete task');
                        queryClient.invalidateQueries({ queryKey: ['tasks'] });
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error deleting task:', error_2);
                    // Refresh task list on error
                    queryClient.invalidateQueries({ queryKey: ['tasks'] });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleCancelTask = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!((activeTask === null || activeTask === void 0 ? void 0 : activeTask.id) && activeTask.id.startsWith('draft-'))) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/tasks?id=".concat(activeTask.id), {
                            method: 'DELETE',
                        })];
                case 2:
                    res = _a.sent();
                    if (res.ok) {
                        handleModalSave(activeTask, 'delete');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.error('Error deleting draft task:', error_3);
                    return [3 /*break*/, 4];
                case 4:
                    // Close the modal
                    handleModalClose();
                    return [2 /*return*/];
            }
        });
    }); };
    var contextValue = (0, react_1.useMemo)(function () { return ({
        setActiveTaskId: setActiveTaskId,
        setNewTaskText: setNewTaskText,
        activeTask: activeTask,
        registerTaskUpdateCallback: registerTaskUpdateCallback,
        unregisterTaskUpdateCallback: unregisterTaskUpdateCallback,
    }); }, [activeTask, registerTaskUpdateCallback, unregisterTaskUpdateCallback]);
    return (<TaskModalContext.Provider value={contextValue}>
      {children}
      <div className={client_providers_module_css_1.default.modalContainer}>
        <drawer_1.Drawer open={!!(activeTaskId || newTaskText !== null || isCreatingNew)} onOpenChange={function (open) {
            if (!open) {
                handleModalClose();
            }
        }} direction="right">
        <drawer_1.DrawerContent direction="right" overlayVariant="settings" className="overflow-hidden">
          <div className={client_providers_module_css_1.default.header}>
            <drawer_1.DrawerTitle className={client_providers_module_css_1.default.title}>
              {((activeTask === null || activeTask === void 0 ? void 0 : activeTask.id) && !activeTask.id.startsWith('draft-')) || (activeTaskId && !activeTaskId.startsWith('draft-')) ? 'EDIT TASK' : 'CREATE TASK'}
            </drawer_1.DrawerTitle>
            <drawer_1.DrawerDescription className="sr-only">
              {((activeTask === null || activeTask === void 0 ? void 0 : activeTask.id) && !activeTask.id.startsWith('draft-')) || (activeTaskId && !activeTaskId.startsWith('draft-')) ? 'Edit the selected task details' : 'Create a new task with title, description, and due date'}
            </drawer_1.DrawerDescription>

            {/* Show actions menu for edit mode, X button for create mode */}
            {((activeTask === null || activeTask === void 0 ? void 0 : activeTask.id) && !activeTask.id.startsWith('draft-')) || (activeTaskId && !activeTaskId.startsWith('draft-')) ? (<dropdown_menu_1.DropdownMenu modal={false}>
                <dropdown_menu_1.DropdownMenuTrigger asChild>
                  <button_1.Button variant="ghost-icon" size="icon">
                    ⋮
                  </button_1.Button>
                </dropdown_menu_1.DropdownMenuTrigger>
                <dropdown_menu_1.DropdownMenuContent align="end">
                  <dropdown_menu_1.DropdownMenuItem onClick={handleDeleteTask} className="text-red-400 focus:text-red-300">
                    Delete
                  </dropdown_menu_1.DropdownMenuItem>
                </dropdown_menu_1.DropdownMenuContent>
              </dropdown_menu_1.DropdownMenu>) : (<drawer_1.DrawerClose asChild>
                <button className="md3-icon-button" aria-label="Close dialog">
                  <icons_1.CloseIcon size={20}/>
                </button>
              </drawer_1.DrawerClose>)}
          </div>
          <EditTaskForm key={(activeTask === null || activeTask === void 0 ? void 0 : activeTask.id) || newTaskText || 'new-task'} task={activeTask} onClose={handleModalClose} onSave={handleModalSave} onCancel={handleCancelTask} initialDescription={newTaskText || undefined}/>
        </drawer_1.DrawerContent>
        </drawer_1.Drawer>
      </div>
    </TaskModalContext.Provider>);
}
