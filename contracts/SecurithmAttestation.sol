// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SecurithmAttestation
/// @notice Stores hash commitments of Securithm solvency attestations so third
///         parties can independently verify that an attestation existed at a
///         point in time on-chain (blueprint section 16).
/// @dev    Only commitments and aggregate metadata are stored — never customer
///         or individual liability data. USD values are stored in cents.
contract SecurithmAttestation {
    struct AttestationData {
        bytes32 reserveRoot;
        bytes32 liabilityRoot;
        uint256 reserveValueCents;
        uint256 liabilityValueCents;
        uint256 timestamp;
    }

    /// @notice Current owner (the only address allowed to publish).
    address public owner;

    mapping(bytes32 => AttestationData) private _attestations;

    event AttestationPublished(
        bytes32 indexed attestationId,
        bytes32 reserveRoot,
        bytes32 liabilityRoot,
        uint256 reserveValueCents,
        uint256 liabilityValueCents,
        uint256 timestamp
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error ZeroAttestationId();
    error AlreadyPublished(bytes32 attestationId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Publish a new attestation commitment. Ids are immutable once set.
    function publishAttestation(
        bytes32 attestationId,
        bytes32 reserveRoot,
        bytes32 liabilityRoot,
        uint256 reserveValueCents,
        uint256 liabilityValueCents,
        uint256 timestamp
    ) external onlyOwner {
        if (attestationId == bytes32(0)) revert ZeroAttestationId();
        if (_attestations[attestationId].timestamp != 0) {
            revert AlreadyPublished(attestationId);
        }
        _attestations[attestationId] = AttestationData({
            reserveRoot: reserveRoot,
            liabilityRoot: liabilityRoot,
            reserveValueCents: reserveValueCents,
            liabilityValueCents: liabilityValueCents,
            timestamp: timestamp
        });
        emit AttestationPublished(
            attestationId,
            reserveRoot,
            liabilityRoot,
            reserveValueCents,
            liabilityValueCents,
            timestamp
        );
    }

    /// @notice Read an attestation commitment.
    function getAttestation(
        bytes32 attestationId
    )
        external
        view
        returns (
            bytes32 reserveRoot,
            bytes32 liabilityRoot,
            uint256 reserveValueCents,
            uint256 liabilityValueCents,
            uint256 timestamp
        )
    {
        AttestationData storage a = _attestations[attestationId];
        return (
            a.reserveRoot,
            a.liabilityRoot,
            a.reserveValueCents,
            a.liabilityValueCents,
            a.timestamp
        );
    }

    /// @notice True when an attestation with this id has been published.
    function exists(bytes32 attestationId) external view returns (bool) {
        return _attestations[attestationId].timestamp != 0;
    }

    /// @notice Transfer contract ownership.
    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
