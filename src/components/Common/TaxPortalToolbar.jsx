import React from 'react';
import { getRawDateString } from '../../authConfig';

const TaxPortalToolbar = ({
  searchPlaceholder = "Search...",
  searchText,
  onSearchChange,
  
  statusOptions,
  filterStatus,
  onFilterStatusChange,
  
  assignedToOptions,
  filterAssignedTo,
  onFilterAssignedToChange,
  
  dueDateOptions,
  filterDueDate,
  onFilterDueDateChange,
  
  pageSize,
  onPageSizeChange,
  
  onAdd,
  addLabel = "➕ Add",
  
  onExport,
  disableExport = false,
  
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <div className="card data-summary-card mb-4 p-3">
      <div className="row g-3 align-items-center">
        {/* Search */}
        <div className="col-md-5">
          <div className="input-group shadow-sm rounded-pill overflow-hidden">
            <span className="input-group-text bg-white border-end-0">🔎</span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter */}
        {statusOptions && (
          <div className="col-md-3">
            <select className="form-select" value={filterStatus} onChange={(e) => onFilterStatusChange(e.target.value)}>
              <option value="nonCompleted">Open / Incomplete</option>
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        )}

        {/* Assignee Filter */}
        {assignedToOptions && (
          <div className="col-md-3">
            <div className="input-group shadow-sm rounded-pill overflow-hidden">
              <span className="input-group-text bg-white border-end-0">👤</span>
              <select
                className="form-select border-start-0"
                value={filterAssignedTo}
                onChange={(e) => onFilterAssignedToChange(e.target.value)}
              >
                <option value="">All assignees</option>
                {assignedToOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Due Date Filter */}
        {dueDateOptions && (
          <div className="col-md-3">
            <select className="form-select" value={filterDueDate} onChange={(e) => onFilterDueDateChange(e.target.value)}>
              <option value="">Upcoming Dues</option>
              {dueDateOptions.map((date) => (
                <option key={date} value={date}>
                  {getRawDateString(date)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page Size */}
        {pageSize !== undefined && onPageSizeChange && (
          <div className="col-md-2">
            <select className="form-select" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
              <option value={25}>25 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        )}

        {/* Buttons */}
        <div className="col-md-7 text-md-end d-flex gap-2 justify-content-end flex-grow-1">
          {onAdd && (
            <button className="btn btn-primary" onClick={onAdd}>
              {addLabel}
            </button>
          )}
          {onExport && (
            <button className="btn btn-outline-success" onClick={onExport} disabled={disableExport}>
              📥 Export
            </button>
          )}
          {onRefresh && (
            <button className="btn btn-outline-primary" onClick={onRefresh} disabled={isRefreshing}>
              {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxPortalToolbar;