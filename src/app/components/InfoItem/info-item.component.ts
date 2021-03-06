import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-info-item',
  templateUrl: './info-item.component.html',
  styleUrls: ['./info-item.component.scss'],
})
export class InfoItemComponent implements OnInit {
  @Input() title: string;
  @Input() date: string;
  @Input() subjects: string[] = [];
  @Input() sponsored: string;
  @Input() ward: string;
  @Input() selectable: boolean;
  @Input() sub: string;
  @Input() status: string;
  @Input() state: string;
  @Input() editUrl: string;
  @Input() department: string;
  @Input() canEdit: boolean;
  @Input() canDelete: boolean;
  @Input() canApprove: boolean;
  @Input() viewUrl: string;
  @Output() approve = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() select = new EventEmitter<void>();
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

  onDelete() {
    this.delete.emit();
  }

  onSelect() {
    this.select.emit();
  }

  onApprove() {
    this.approve.emit();
  }
}
