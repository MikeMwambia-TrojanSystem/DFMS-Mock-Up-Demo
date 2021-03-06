import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-report-item',
  templateUrl: './report-item.component.html',
  styleUrls: ['./report-item.component.scss'],
})
export class ReportItemComponent implements OnInit {
  @Output() select = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() approve = new EventEmitter<void>();
  @Input() title: string;
  @Input() date: string;
  @Input() concerning: string[] = [];
  @Input() submitted: string;
  @Input() ward: string;
  @Input() response: string;
  @Input() selectable: boolean;
  @Input() sub: string;
  @Input() state: string;
  @Input() editUrl: string;
  @Input() viewUrl: string;
  @Input() canEdit: boolean;
  @Input() canDelete: boolean;
  @Input() canApprove: boolean;
  stateExpanded: string;

  ngOnInit() {
    if (this.state === 'draft') {
      this.stateExpanded = 'Draft';
    }
    if (this.state === 'public') {
      this.stateExpanded = 'Public';
    }
    if (this.state === 'private') {
      this.stateExpanded = 'Private';
    }
  }

  onSelect() {
    this.select.emit();
  }

  onDelete() {
    this.delete.emit();
  }

  onApprove() {
    this.approve.emit();
  }
}
