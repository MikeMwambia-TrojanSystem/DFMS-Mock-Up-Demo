import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { take, takeUntil } from 'rxjs/operators';
import moment from 'moment';

import { CachedCallback, CacheService } from 'src/app/services/cache.service';
import { McaEmployeeService } from 'src/app/services/mca-employee.service';
import { McaEmployee } from 'src/app/shared/types/mca-employee';
import { phoneNumberValidator } from 'src/app/shared/validators/phone-number';
import { Upload } from 'src/app/shared/types/upload';
import { PhoneVerification } from 'src/app/shared/types/verification';
import { Subject } from 'rxjs';

type Cache = {
  form: FormGroup;
  filename: string;
  verification?: PhoneVerification;
};

@Component({
  selector: 'app-create-mca',
  templateUrl: './create-mca.component.html',
  styleUrls: ['./create-mca.component.scss'],
})
export class CreateMcaComponent implements OnInit, OnDestroy {
  private _mode: 'editing' | 'creating';
  private _mcaId: string;
  private _cacheId: string;
  private _createdUser = false;
  private $onDestroy = new Subject<void>();

  form = new FormGroup({
    assemblyId: new FormControl(
      '603cbd73bd0107cf86d79170',
      Validators.required
    ),
    dateCreated: new FormControl(''),
    group: new FormControl('MCA'),
    name: new FormControl('', Validators.required),
    phoneNumber: new FormControl({ value: '', disabled: this._createdUser }, [
      Validators.required,
      phoneNumberValidator,
    ]),
    politicalParty: new FormControl('', Validators.required),
    positionStatus: new FormControl('', Validators.required),
    profilePic: new FormControl('', Validators.required),
    signature: new FormControl(''),
    status: new FormControl(false),
    termStart: new FormControl('', Validators.required),
    termEnd: new FormControl('', Validators.required),
    termOfService: new FormControl(''),
    ward: new FormControl('', Validators.required),
    wardId: new FormControl('', Validators.required),
    published: new FormControl(false),
    publishState: new FormControl('draft'),
  });

  filename: string;
  authorName: string;

  constructor(
    private cacheService: CacheService,
    private router: Router,
    private mcaEmployeeService: McaEmployeeService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get cache id from query url
    const queryParams = this.route.snapshot.queryParams;
    this._cacheId = queryParams.id;
    this._createdUser = queryParams.user === 'true';

    // Populate mca data from resolver using param id
    const committeeId = this.route.snapshot.params.id;

    if (committeeId) {
      this._mode = 'editing';
      this._mcaId = committeeId;

      this.route.data
        .pipe(take(1))
        .subscribe(({ mca }: { mca: McaEmployee }) => {
          const { termOfService, authorName, ...others } = mca;
          const [termStart, termEnd] = termOfService.split(' to ');

          this.form.patchValue({
            ...others,
            termStart: moment(termStart, 'Do MMMM YYYY').toJSON().slice(0, 10),
            termEnd: moment(termEnd, 'Do MMMM YYYY').toJSON().slice(0, 10),
          });

          const index = mca.profilePic.lastIndexOf('amazonaws.com/') + 14;

          this.filename = mca.profilePic.substring(index);
          this.authorName = authorName;
        });
    } else {
      this._mode = 'creating';
    }

    if (this._createdUser) {
      const form = JSON.parse(localStorage.getItem('account'));

      this.form.patchValue({
        ...form,
      });
      this.form.get('phoneNumber').disable();
    }

    // Rehydrate cached form data if there's any
    const cached = this.cacheService.rehydrate<Cache>('CREATE_MCA');

    if (cached) {
      const { form, filename } = cached;

      this.form = form;
      this.filename = filename;
    }

    // On Category change
    this.form
      .get('positionStatus')
      .valueChanges.pipe(takeUntil(this.$onDestroy))
      .subscribe((value) => {
        this.form.patchValue({
          ward: value === 'Nominated' ? 'NONE' : '',
          wardId: value === 'Nominated' ? 'NONE' : '',
        });
      });
  }

  ngOnDestroy(): void {
    this.$onDestroy.next();
  }

  get ward(): string {
    const value = this.form.value.ward;
    return value && value !== 'NONE' ? value : '';
  }

  private _onCache<T>(
    { url, queryParams }: { url: string; queryParams?: Params },
    callback: CachedCallback<Cache, T>
  ) {
    this.cacheService.cacheFunc<Cache, T>({
      id: 'CREATE_MCA',
      cacheId: this._cacheId,
      urlParamer: this._mcaId,
      returnUrl: '/create/mca',
      navigateUrl: url,
      navigateUrlQuery: queryParams,
      data: { form: this.form, filename: this.filename },
      callback,
    })();
  }

  /**
   * This function get called when 'Select Ward Represented' button is clicked.
   * Caching the form and then redirect the user to '/list/wards?select=true'.
   * After the user had selected the ward, a callback function will get called and update the cached data with the selected information.
   */
  onWardSelect() {
    this._onCache(
      { url: '/list/wards' },
      ({ form, filename }, { _id, name }) => {
        form.patchValue({
          wardId: _id,
          ward: name,
        }); // Patch cached form with new ward information.

        return { form, filename };
      }
    );
  }

  // This function is called when '' button is clicked
  /**
   * This function get called when 'Upload Profile Picture' button is clicked.
   * Caching the form and then redirect the user to '/management/upload'.
   */
  onProfileSelect() {
    this._onCache<{ result: Upload }>(
      {
        url: '/management/upload',
        queryParams: {
          select: undefined,
          category: 'mca',
        },
      },
      ({ form }, { result }) => {
        form.patchValue({
          profilePic: result.location,
        });

        return { form, filename: result.key };
      }
    );
  }

  // This function is called when 'Save as Draft' or 'Save MCA' buttons are clicked
  onSave(published: boolean) {
    try {
      // Subcription callback
      const subCallback = ({ _mcaId, request_id }: any) => {
        this.cacheService.clearCache('CREATE_MCA');

        this.router.navigate(['/list/mca-employee'], {
          queryParams: {
            state: published ? 'published' : 'draft',
          },
        });

        // if (request_id) {
        //   this.router.navigate(['/verification/mca'], {
        //     queryParams: {
        //       userId: _mcaId,
        //       request_id,
        //       state: published ? 'published' : 'draft',
        //     },
        //   });
        // } else {
        //   this.router.navigate(['/list/mca-employee'], {
        //     queryParams: {
        //       state: published ? 'published' : 'draft',
        //     },
        //   });
        // }
      };

      // Transform form termStart and termEnd values into a single termOfService string for API parameter.
      const transform = () => {
        const value = this.form.value;
        const termStart = moment(value.termStart).format('Do MMMM YYYY');
        const termEnd = moment(value.termEnd).format('Do MMMM YYYY');

        return `${termStart} to ${termEnd}`;
      };

      const value = this.form.value;

      value.termOfService = transform();
      value.publishState = published;

      if (this._mode === 'creating') {
        value.dateCreated = moment().toISOString();
        value.signature = moment().unix();
        value.published = false;

        this.mcaEmployeeService.postMca(value).subscribe(subCallback);
      } else {
        value.id = this._mcaId;
        value.group = 'mca';
        value.authorName = this.authorName;

        this.mcaEmployeeService.updateMca(value).subscribe(subCallback);
      }
    } catch (error) {
      alert('Invalid date input');
    }
  }
}
