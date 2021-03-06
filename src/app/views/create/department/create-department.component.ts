import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { CacheService } from 'src/app/services/cache.service';
import { DepartmentService } from 'src/app/services/department.service';
import { Department } from 'src/app/shared/types/department';

@Component({
  selector: 'app-create-department',
  templateUrl: './create-department.component.html',
  styleUrls: ['./create-department.component.scss'],
})
export class CreateDepartmentComponent implements OnInit {
  private _cacheId: string;
  private _mode: 'creating' | 'editing';
  private _departmentId: string;
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    assemblyId: new FormControl('2d887s61a', Validators.required),
    published: new FormControl(false),
    publishState: new FormControl('draft'),
    members: new FormControl(''),
  }); // Form group that holds user input

  county = 'Meru'; // Dynamic county name;

  constructor(
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute,
    private cacheService: CacheService
  ) {}

  ngOnInit() {
    // Get return url from query url
    this._cacheId = this.route.snapshot.queryParams.id;

    // Populate department data from resolver using param id
    const departmentId = this.route.snapshot.params.id;

    if (departmentId) {
      this._mode = 'editing';
      this._departmentId = departmentId;

      this.route.data
        .pipe(take(1))
        .subscribe(({ department }: { department: Department }) => {
          const { members, ...others } = department;

          this.form.patchValue({
            ...others,
            members: members.join('&&&'),
          });
        });
    } else {
      this._mode = 'creating';
    }

    // Rehydrate from cached data if there's any
    const cachedForm = this.cacheService.rehydrate<FormGroup>(
      'CREATE_DEPARTMENT'
    );

    if (cachedForm) {
      this.form = cachedForm;
    }
  }

  /**
   * This function get called when 'Save' button is clicked.
   * Post the department form data to backend.
   */
  onSave(published: boolean) {
    // Subcription callback
    const subCallback = () => {
      this.cacheService.clearCache('CREATE_DEPARTMENT');

      this.router.navigate(['/list/department'], {
        queryParams: {
          state: published ? 'published' : 'draft',
        },
      });
    };

    const value = this.form.value;

    value.publishState = published ? 'published' : 'draft';
    value.members = `${value.members}${
      value.members.indexOf('&&&') === -1 ? '&&&' : ''
    }`;

    if (this._mode === 'creating') {
      this.departmentService.postDepartment(value).subscribe(subCallback);
    } else {
      value.id = this._departmentId;

      // if (!(value.members as string[]).length) {
      //   value.members = '[]';
      // }

      this.departmentService.updateDepartment(value).subscribe(subCallback);
    }
  }
}
