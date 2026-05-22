import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';

function Decision() {
  return (
    <div className="erp-card">
      <div className="erp-card-header">
        <h2 className="erp-card-title">
          <Lightbulb size={18} color="#ea580c" />
          Decision Insights
        </h2>
      </div>
      <div className="erp-card-content">
        <div className="decision-list">
          <div className="decision-alert primary">
            <h4>Resource Allocation Needed</h4>
            <p>
              The "QC Sample Status" board has a high number of pending items. Consider re-allocating team members.
            </p>
            <button className="erp-action-btn">
              Take Action <ArrowRight size={14} />
            </button>
          </div>

          <div className="decision-alert success">
            <h4>Efficiency Target Met</h4>
            <p style={{ marginBottom: 0 }}>
              Short term goals for Q2 are currently tracking 15% ahead of schedule across all major boards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Decision;

