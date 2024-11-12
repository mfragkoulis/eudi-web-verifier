import {CommonModule} from '@angular/common';
import {Component, inject, Input, OnInit} from '@angular/core';
import {MatListModule} from '@angular/material/list';
import {SharedModule} from "@shared/shared.module";
import {MatExpansionModule} from "@angular/material/expansion";
import {ConcludedTransaction} from "@core/models/ConcludedTransaction";
import {PresentationDefinition} from "@core/models/presentation/PresentationDefinition";
import {ViewAttestationComponent} from "@features/invoke-wallet/components/view-attestation/view-attestation.component";
import {SharedAttestation, Single} from "@core/models/presentation/SharedAttestation";
import {WalletResponseProcessorService} from "@features/invoke-wallet/services/wallet-response-processor.service";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {HttpService} from '@network/http/http.service';
import {HttpHeaders} from '@angular/common/http';
import {LocalStorageService} from '@app/core/services/local-storage.service';
import { TxData } from '@features/home/components/home/home.component';

@Component({
  selector: 'vc-presentations-results',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    SharedModule,
    MatExpansionModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    ViewAttestationComponent
  ],
  providers: [WalletResponseProcessorService],
  templateUrl: './presentations-results.component.html',
  styleUrls: ['./presentations-results.component.scss']
})
export class PresentationsResultsComponent implements OnInit {
  constructor(
    private readonly responseProcessor: WalletResponseProcessorService,
    private readonly httpService: HttpService
  ) {
  }

  @Input() concludedTransaction!: ConcludedTransaction;
  presentationRequest!: PresentationDefinition;
  attestations!: Single[];
  readonly dialog: MatDialog = inject(MatDialog);
  readonly localStorageService: LocalStorageService = inject(LocalStorageService);
  txdata: TxData = {'application_id': '', 'target': ''};

  ngOnInit(): void {
    this.presentationRequest = this.concludedTransaction.presentationDefinition;
    let sharedAttestations: SharedAttestation[] = this.responseProcessor.mapVpTokenToAttestations(this.concludedTransaction);
    this.attestations = this.flatten(sharedAttestations);

    this.postAttestations()
  }

  postAttestations(): void {
    this.txdata = JSON.parse(this.localStorageService.get('txdata') || '');
    let data = {
	    "profile": this.attestations,
	    "entity": "ΚΕΠ"
    };
    data = Object.assign(this.txdata, data);
    console.log("Tx data", this.txdata);
    console.log("Attestations", this.attestations);
    console.log("Post attestation data", data);

    const headers = {
	    'Content-Type': 'application/json',
    };
    const requestOptions = {
	    'headers': new HttpHeaders(headers),
    };

    this.httpService.postE(
	    "http://83.212.72.114/api/eudi_present/", data, requestOptions
    )
    .subscribe(response => console.log(response))
  }

  flatten(sharedAttestations: SharedAttestation[]): Single[] {
    let singles: Single[] = []
    sharedAttestations.forEach(it => {
      switch (it.kind) {
        case "enveloped":
          return singles.push(...it.attestations)
        case "single":
          return singles.push(it)
      }
    })
    return singles
  }

  viewContents(attestation: Single) {
    this.dialog.open(ViewAttestationComponent, {
      data: {
        attestation: attestation
      },
      height: '40%',
      width: '60%',
    });
  }
}
