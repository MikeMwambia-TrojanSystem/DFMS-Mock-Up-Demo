import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';

import { CacheService } from 'src/app/services/cache.service';
import { CommitteeService } from 'src/app/services/committee.service';
import { McaEmployeeService } from 'src/app/services/mca-employee.service';
import { Committee, CommitteePost } from 'src/app/shared/types/committee';
import moment from 'moment';
import { Personnel } from 'src/app/shared/types/personnel';

interface CommitteeForm {
  commiteeSignature: string;
  name: string;
  Chairname: string;
  chairId: string;
  viceChair: string;
  viceChairId: string;
  committesMembers: string;
  departmentInExcecutive: string;
  approverId: string;
  published: boolean;
  assemblyId: string;
}

@Component({
  selector: 'app-create-committee',
  templateUrl: './create-committee.component.html',
  styleUrls: ['./create-committee.component.scss'],
})
export class CreateCommitteeComponent implements OnInit {
  private _mode: 'editing' | 'creating';
  private _committeeId: string;
  private _cacheId: string;
  form = new FormGroup({
    commiteeSignature: new FormControl(''),
    name: new FormControl('', Validators.required),
    Chairname: new FormControl('', Validators.required),
    chairId: new FormControl('', Validators.required),
    viceChair: new FormControl('', Validators.required),
    viceChairId: new FormControl('', Validators.required),
    committesMembers: new FormControl('', Validators.required),
    departmentInExcecutive: new FormControl('', Validators.required),
    clerkAssistant: new FormControl('', Validators.required),
    clerkAssistantId: new FormControl('', Validators.required),
    approverId: new FormControl(''),
    published: new FormControl(false),
    publishState: new FormControl('draft'),
    assemblyId: new FormControl('123'),
    account: new FormControl(''),
    datePublished: new FormControl(''),
  }); // Form group that holds user input

  membersName: { name: string; _id: string }[] = []; // Committees Memebers name.

  constructor(
    private cacheService: CacheService,
    private router: Router,
    private committeeService: CommitteeService,
    private mcaEmployeeService: McaEmployeeService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get cache id from query url
    this._cacheId = this.route.snapshot.queryParams.id;

    // Populate committee data from resolver using param id
    const committeeId = this.route.snapshot.params.id;

    if (committeeId) {
      this._mode = 'editing';
      this._committeeId = committeeId;

      this.route.data
        .pipe(take(1))
        .subscribe(({ committee }: { committee: Committee }) => {
          const { committesMembers, ...others } = committee;

          this.form.patchValue({
            ...others,
            Chairname: committee.chair.name,
            chairId: committee.chair.id,
            viceChair: committee.viceChair.name,
            viceChairId: committee.viceChair.id,
            approverId: committee.approvingAccount.approverId,
            account: committee.approvingAccount.account,
            committesMembers: committesMembers.join('&&&'),
          });
        });
    } else {
      this._mode = 'creating';
    }

    // Rehydrate cached form data if there's any
    const cachedForm = this.cacheService.rehydrate<FormGroup>(
      'CREATE_COMMITTEE'
    );

    if (cachedForm) {
      this.form = cachedForm;
    }

    // Update members name from form committesMembers ids
    this.updateMembersList();
  }

  county = 'Meru'; // Dynamic county name;

  get chairmanName(): string {
    return this.form.get('Chairname').value;
  }

  get viceChairName(): string {
    return this.form.get('viceChair').value;
  }

  get departmentInExcecutive(): string {
    return this.form.get('departmentInExcecutive').value;
  }

  get clerkNames(): string[] {
    const value = (this.form.get('clerkAssistant').value as string).split(
      '&&&'
    );
    return value[0].length ? value : [];
  }

  async updateMembersList() {
    const names: { name: string; _id: string }[] = [];
    const {
      committesMembers,
      chairId,
      viceChair,
      Chairname,
      viceChairId,
    } = this.form.value as CommitteeForm;

    let members = committesMembers.split('&&&');

    members = members.filter((m) => m.length);

    for (const memberId of members.filter(
      (memberId) => memberId !== chairId && memberId !== viceChairId
    )) {
      const name = await this.mcaEmployeeService
        .getMcaEmployee(memberId)
        .pipe(
          take(1),
          map((employee) => (employee ? employee.name : 'No employee found'))
        )
        .toPromise();

      names.push({
        name,
        _id: memberId,
      });
    }

    if (Chairname) {
      this.membersName.push({
        name: Chairname,
        _id: chairId,
      });
    }
    if (viceChair && chairId !== viceChairId) {
      this.membersName.push({
        name: viceChair,
        _id: viceChairId,
      });
    }

    this.membersName = [...this.membersName, ...names];
  }

  /**
   * This function get called when 'Select Chairman' button is clicked.
   * Caching the form and then redirect the user to '/list/mca-employee?select=true'.
   * After the user had selected the employee, a callback function will get called and update the cached data with the selected information.
   */
  onSelectChairman() {
    // Caching and select callback handling
    const urlTree = this._committeeId
      ? ['/create/committee', this._committeeId]
      : ['/create/committee'];
    this.cacheService.cache<FormGroup, { _id: string; name: string }>(
      'CREATE_COMMITTEE',
      this.form,
      this.router.createUrlTree(urlTree, {
        queryParams: {
          id: this._cacheId,
        },
      }),
      (form, { _id, name }) => {
        if (form.value.viceChairId !== _id) {
          form.patchValue({
            Chairname: name,
            chairId: _id,
          }); // Patch cached form with new chairman information.
        }

        return form;
      }
    );

    // Navigate the user to '/list/mca-employee?select=true'
    this.router.navigate(['/list/mca-employee'], {
      queryParams: { select: true, id: 'CREATE_COMMITTEE' },
    });
  }

  /**
   * This function get called when 'Select Vice Chairman' button is clicked.
   * Caching the form and then redirect the user to '/list/mca-employee?select=true'.
   * After the user had selected the employee, a callback function will get called and update the cached data with the selected information.
   */
  onSelectViceChairman() {
    // Caching and select callback handling
    const urlTree = this._committeeId
      ? ['/create/committee', this._committeeId]
      : ['/create/committee'];
    this.cacheService.cache<FormGroup, { _id: string; name: string }>(
      'CREATE_COMMITTEE',
      this.form,
      this.router.createUrlTree(urlTree, {
        queryParams: {
          id: this._cacheId,
        },
      }),
      (form, { _id, name }) => {
        if (form.value.chairId !== _id) {
          form.patchValue({
            viceChair: name,
            viceChairId: _id,
          }); // Patch cached form with new vice chairman information.
        }

        return form;
      }
    );

    // Navigate the user to '/list/mca-employee?select=true'
    this.router.navigate(['/list/mca-employee'], {
      queryParams: { select: true, id: 'CREATE_COMMITTEE' },
    });
  }

  /**
   * This function get called when 'Select Members' button is clicked.
   * Caching the form and then redirect the user to '/list/mca-employee?select=true'.
   * After the user had selected the employee, a callback function will get called and update the cached data with the selected information.
   */
  onSelectMember() {
    // Caching and select callback handling
    const urlTree = this._committeeId
      ? ['/create/committee', this._committeeId]
      : ['/create/committee'];
    this.cacheService.cache<FormGroup, { _id: string; name: string }>(
      'CREATE_COMMITTEE',
      this.form,
      this.router.createUrlTree(urlTree, {
        queryParams: {
          id: this._cacheId,
        },
      }),
      (form, { _id, name }) => {
        let members = (form.get('committesMembers').value as string).split(
          '&&&'
        );

        members = members[0].length ? members : [];

        members.push(_id);

        form.patchValue({
          committesMembers: members.join('&&&'),
        });

        return form;
      }
    );

    // Navigate the user to '/list/mca-employee?select=true'
    this.router.navigate(['/list/mca-employee'], {
      queryParams: { select: true, id: 'CREATE_COMMITTEE' },
    });
  }

  /**
   * This function get called when 'Select Department' button is clicked.
   * Caching the form and then redirect the user to '/list/department?select=true'.
   * After the user had selected the department, a callback function will get called and update the cached data with the selected information.
   */
  onSelectDepartment() {
    // Caching and select callback handling
    const urlTree = this._committeeId
      ? ['/create/committee', this._committeeId]
      : ['/create/committee'];
    this.cacheService.cache<FormGroup, { _id: string; name: string }>(
      'CREATE_COMMITTEE',
      this.form,
      this.router.createUrlTree(urlTree, {
        queryParams: {
          id: this._cacheId,
        },
      }),
      (form, { _id, name }) => {
        form.patchValue({
          departmentInExcecutive: name,
        }); // Patch cached form with new department information.

        return form;
      }
    );

    // Navigate the user to '/list/department?select=true'
    this.router.navigate(['/list/department'], {
      queryParams: { select: true, id: 'CREATE_COMMITTEE' },
    });
  }

  onSelectClerk() {
    const urlTree = this._committeeId
      ? ['/create/committee', this._committeeId]
      : ['/create/committee'];
    this.cacheService.cache<FormGroup, Personnel>(
      'CREATE_COMMITTEE',
      this.form,
      this.router.createUrlTree(urlTree, {
        queryParams: {
          id: this._cacheId,
        },
      }),
      (form, { _id, name }) => {
        let ids = (form.value.clerkAssistantId as string).split('&&&');
        let names = (form.value.clerkAssistant as string).split('&&&');
        ids = ids[0].length ? ids : [];
        names = names[0].length ? names : [];

        if (ids.findIndex((id) => id === _id) === -1) {
          ids.push(_id);
          names.push(name);

          form.patchValue({
            clerkAssistantId: ids.join('&&&'),
            clerkAssistant: names.join('&&&'),
          });
        }

        return form;
      }
    );

    this.router.navigate(['/list/personnel'], {
      queryParams: { select: true, id: 'CREATE_COMMITTEE' },
    });
  }

  /**
   * This function get called when 'Save Committee' or 'Save as Draft' buttons is clicked.
   */
  onSave(published: boolean): void {
    // Subcription callback
    const subCallback = () => {
      this.cacheService.clearCache('CREATE_COMMITTEE');

      this.router.navigate(['/list/committee'], {
        queryParams: {
          state: published ? 'published' : 'draft',
        },
      });
    };

    const value = this.form.value;
    value.publishState = published ? 'published' : 'draft';
    value.committesMembers = `${value.committesMembers}${
      value.committesMembers.indexOf('&&&') === -1 ? '&&&' : ''
    }`;

    if (this._mode === 'creating') {
      value.commiteeSignature = moment().unix();
      value.datePublished = new Date().toISOString();
      value.published = false;

      this.committeeService.postCommittee(value).subscribe(subCallback);
    } else {
      value.id = this._committeeId;

      this.committeeService.updateCommittee(value).subscribe(subCallback);
    }
  }

  /**
   * This function get called when 'Delete' button at member list is clicked
   */
  onMemberDelete(memberId: string) {
    const { chairId, viceChairId, committesMembers } = this.form
      .value as CommitteeForm;

    if (memberId === chairId) {
      this.form.get('chairId').setValue('');
      this.form.get('Chairname').setValue('');
    }

    if (memberId === viceChairId) {
      this.form.get('viceChairId').setValue('');
      this.form.get('viceChair').setValue('');
    }

    const members = committesMembers.split('&&&')[0].length
      ? committesMembers.split('&&&')
      : [];
    const memberIndex = members.findIndex((id) => id === memberId);
    members.splice(memberIndex, 1);

    this.form.patchValue({
      committesMembers: members.join('&&&'),
    });

    const index = this.membersName.findIndex(
      (member) => member._id === memberId
    );
    this.membersName.splice(index, 1);
  }

  onClerkDelete(name: string) {
    let ids = (this.form.value.clerkAssistantId as string).split('&&&');
    let names = (this.form.value.clerkAssistant as string).split('&&&');

    const index = names.findIndex((n) => n === name);

    if (index !== -1) {
      ids.splice(index, 1);
      names.splice(index, 1);

      this.form.patchValue({
        clerkAssistantId: ids.join('&&&'),
        clerkAssistant: names.join('&&&'),
      });
    }
  }
}
